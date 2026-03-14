import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Select,
  TextField,
  Button,
  BlockStack,
  Banner,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect } from "react";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useTranslation } from "../i18n/i18nContext";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  let settings = await prisma.appSettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { shop: session.shop },
    });
  }

  return json({
    translationMode: settings.translationMode,
    apiKey: settings.apiKey ?? "",
    defaultLocales: settings.defaultLocales,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const translationMode = formData.get("translationMode") as string;
  const apiKey = formData.get("apiKey") as string;
  const defaultLocales = formData.get("defaultLocales") as string;

  await prisma.appSettings.upsert({
    where: { shop: session.shop },
    update: {
      translationMode,
      apiKey: apiKey || null,
      defaultLocales,
    },
    create: {
      shop: session.shop,
      translationMode,
      apiKey: apiKey || null,
      defaultLocales,
    },
  });

  return json({ saved: true });
};

export default function Settings() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { t } = useTranslation();

  const [translationMode, setTranslationMode] = useState(
    data.translationMode,
  );
  const [apiKey, setApiKey] = useState(data.apiKey);
  const [defaultLocales, setDefaultLocales] = useState(data.defaultLocales);

  const saved = fetcher.data?.saved ?? false;

  useEffect(() => {
    setTranslationMode(data.translationMode);
    setApiKey(data.apiKey);
    setDefaultLocales(data.defaultLocales);
  }, [data]);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("translationMode", translationMode);
    formData.append("apiKey", apiKey);
    formData.append("defaultLocales", defaultLocales);
    fetcher.submit(formData, { method: "POST" });
  }, [translationMode, apiKey, defaultLocales, fetcher]);

  const modeOptions = [
    { label: t("settings.mockMode"), value: "mock" },
    { label: t("settings.claudeApiMode"), value: "claude-api" },
  ];

  return (
    <Page title={t("settings.pageTitle")}>
      <TitleBar title={t("settings.pageTitle")} />
      <BlockStack gap="500">
        <Layout>
          <Layout.AnnotatedSection
            title={t("settings.translationMode")}
            description={t("settings.translationModeDescription")}
          >
            <Card>
              <BlockStack gap="400">
                <Select
                  label={t("settings.translationMode")}
                  options={modeOptions}
                  value={translationMode}
                  onChange={setTranslationMode}
                />
                {translationMode === "claude-api" && (
                  <TextField
                    label={t("settings.claudeApiKey")}
                    value={apiKey}
                    onChange={setApiKey}
                    type="password"
                    helpText={t("settings.claudeApiKeyHelp")}
                    autoComplete="off"
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>

          <Layout.AnnotatedSection
            title={t("settings.defaultLanguages")}
            description={t("settings.defaultLanguagesDescription")}
          >
            <Card>
              <TextField
                label={t("settings.defaultLocales")}
                value={defaultLocales}
                onChange={setDefaultLocales}
                helpText={t("settings.defaultLocalesHelp")}
                autoComplete="off"
              />
            </Card>
          </Layout.AnnotatedSection>

          <Layout.Section>
            <BlockStack gap="400">
              {saved && (
                <Banner tone="success">
                  <Text as="p" variant="bodyMd">
                    {t("settings.savedSuccess")}
                  </Text>
                </Banner>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                loading={fetcher.state !== "idle"}
              >
                {t("settings.saveSettings")}
              </Button>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
