import { useState, useCallback } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Banner,
  Text,
  Spinner,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import { fetchProduct } from "../services/product-fetcher.server";
import { translate } from "../services/translation.server";
import {
  getShopLocales,
  getTranslatableContent,
  registerTranslations,
} from "../services/shopify-locale.server";
import { LanguageSelector } from "../components/LanguageSelector";
import { TranslationPreview } from "../components/TranslationPreview";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const productIds = url.searchParams.getAll("productId");

  const products = (
    await Promise.all(productIds.map((id) => fetchProduct(admin, id)))
  ).filter(Boolean);

  const shopLocales = await getShopLocales(admin);
  const nonPrimaryLocales = shopLocales.filter((l) => !l.primary && l.published);

  return json({
    products,
    availableLocales: nonPrimaryLocales.map((l) => ({
      locale: l.locale,
      name: l.name,
    })),
    shop: session.shop,
  });
};

interface TranslationPreviewData {
  productId: string;
  productTitle: string;
  targetLocale: string;
  originalTitle: string;
  translatedTitle: string;
  originalBody: string;
  translatedBody: string;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "preview") {
    const productIds = formData.getAll("productId") as string[];
    const targetLocales = formData.getAll("targetLocale") as string[];

    const previews: TranslationPreviewData[] = [];

    for (const productId of productIds) {
      const product = await fetchProduct(admin, productId);
      if (!product) continue;

      for (const locale of targetLocales) {
        const result = await translate(
          { title: product.title, body: product.descriptionHtml },
          locale,
          session.shop,
        );

        previews.push({
          productId: product.id,
          productTitle: product.title,
          targetLocale: locale,
          originalTitle: product.title,
          translatedTitle: result.translatedTitle,
          originalBody: product.descriptionHtml,
          translatedBody: result.translatedBody,
        });
      }
    }

    return json({ intent: "preview", previews, saved: false });
  }

  if (intent === "save") {
    const previewsJson = formData.get("previews") as string;
    const previews: TranslationPreviewData[] = JSON.parse(previewsJson);
    const errors: string[] = [];

    for (const preview of previews) {
      const content = await getTranslatableContent(admin, preview.productId);
      const titleContent = content.find((c) => c.key === "title");
      const bodyContent = content.find((c) => c.key === "body_html");

      const translations = [];
      if (titleContent) {
        translations.push({
          locale: preview.targetLocale,
          key: "title",
          value: preview.translatedTitle,
          translatableContentDigest: titleContent.digest,
        });
      }
      if (bodyContent) {
        translations.push({
          locale: preview.targetLocale,
          key: "body_html",
          value: preview.translatedBody,
          translatableContentDigest: bodyContent.digest,
        });
      }

      if (translations.length > 0) {
        const result = await registerTranslations(
          admin,
          preview.productId,
          translations,
        );
        if (!result.success) {
          errors.push(...result.errors);
        }
      }

      await prisma.translationJob.create({
        data: {
          shop: session.shop,
          productId: preview.productId,
          targetLocale: preview.targetLocale,
          status: errors.length > 0 ? "failed" : "completed",
          originalTitle: preview.originalTitle,
          translatedTitle: preview.translatedTitle,
          originalBody: preview.originalBody,
          translatedBody: preview.translatedBody,
        },
      });
    }

    if (errors.length > 0) {
      return json({ intent: "save", previews: [], saved: false, errors });
    }

    return json({ intent: "save", previews: [], saved: true });
  }

  return json({ intent: "", previews: [], saved: false });
};

export default function TranslatePage() {
  const { products, availableLocales, shop } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);

  const isLoading = fetcher.state !== "idle";
  const previews = fetcher.data?.previews ?? [];
  const saved = fetcher.data?.saved ?? false;
  const actionErrors = (fetcher.data as any)?.errors as string[] | undefined;

  const handlePreview = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "preview");
    products.forEach((p: any) => formData.append("productId", p.id));
    selectedLocales.forEach((l) => formData.append("targetLocale", l));
    fetcher.submit(formData, { method: "POST" });
  }, [products, selectedLocales, fetcher]);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("previews", JSON.stringify(previews));
    fetcher.submit(formData, { method: "POST" });
  }, [previews, fetcher]);

  return (
    <Page
      backAction={{ url: "/app" }}
      title="Translate Products"
    >
      <TitleBar title="Translate Products" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Selected Products ({products.length})
                  </Text>
                  {products.map((product: any) => (
                    <Text key={product.id} as="p" variant="bodyMd">
                      {product.title}
                    </Text>
                  ))}
                </BlockStack>
              </Card>

              <Card>
                <LanguageSelector
                  availableLocales={availableLocales}
                  selectedLocales={selectedLocales}
                  onChange={setSelectedLocales}
                />
              </Card>

              <InlineStack gap="300">
                <Button
                  variant="primary"
                  disabled={selectedLocales.length === 0 || isLoading}
                  onClick={handlePreview}
                >
                  {isLoading && fetcher.formData?.get("intent") === "preview"
                    ? "Translating..."
                    : "Preview Translation"}
                </Button>
              </InlineStack>

              {isLoading && (
                <InlineStack align="center" gap="200">
                  <Spinner size="small" />
                  <Text as="span" variant="bodyMd">
                    Processing...
                  </Text>
                </InlineStack>
              )}

              {saved && (
                <Banner tone="success">
                  <Text as="p" variant="bodyMd">
                    Translations saved to Shopify successfully!
                  </Text>
                </Banner>
              )}

              {actionErrors && actionErrors.length > 0 && (
                <Banner tone="critical">
                  <BlockStack gap="100">
                    {actionErrors.map((err, i) => (
                      <Text key={i} as="p" variant="bodyMd">
                        {err}
                      </Text>
                    ))}
                  </BlockStack>
                </Banner>
              )}

              {previews.length > 0 && !saved && (
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Translation Preview
                  </Text>
                  {previews.map((preview: any, index: number) => (
                    <TranslationPreview
                      key={`${preview.productId}-${preview.targetLocale}`}
                      productTitle={preview.productTitle}
                      originalTitle={preview.originalTitle}
                      translatedTitle={preview.translatedTitle}
                      originalBody={preview.originalBody}
                      translatedBody={preview.translatedBody}
                      targetLocale={preview.targetLocale}
                    />
                  ))}
                  <Button
                    variant="primary"
                    tone="success"
                    disabled={isLoading}
                    onClick={handleSave}
                  >
                    {isLoading && fetcher.formData?.get("intent") === "save"
                      ? "Saving..."
                      : "Save to Shopify"}
                  </Button>
                </BlockStack>
              )}
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
