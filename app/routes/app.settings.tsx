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
    { label: "Mock (Free - for testing)", value: "mock" },
    { label: "Claude API (Production)", value: "claude-api" },
  ];

  return (
    <Page title="Settings">
      <TitleBar title="Settings" />
      <BlockStack gap="500">
        <Layout>
          <Layout.AnnotatedSection
            title="Translation Mode"
            description="Choose between mock translation (free, for testing) and Claude API (production quality)."
          >
            <Card>
              <BlockStack gap="400">
                <Select
                  label="Translation Mode"
                  options={modeOptions}
                  value={translationMode}
                  onChange={setTranslationMode}
                />
                {translationMode === "claude-api" && (
                  <TextField
                    label="Claude API Key"
                    value={apiKey}
                    onChange={setApiKey}
                    type="password"
                    helpText="Your Anthropic API key. Charges apply per translation."
                    autoComplete="off"
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>

          <Layout.AnnotatedSection
            title="Default Languages"
            description="Comma-separated locale codes for target languages."
          >
            <Card>
              <TextField
                label="Default Locales"
                value={defaultLocales}
                onChange={setDefaultLocales}
                helpText='e.g., "en,ja" for English and Japanese'
                autoComplete="off"
              />
            </Card>
          </Layout.AnnotatedSection>

          <Layout.Section>
            <BlockStack gap="400">
              {saved && (
                <Banner tone="success">
                  <Text as="p" variant="bodyMd">
                    Settings saved successfully!
                  </Text>
                </Banner>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                loading={fetcher.state !== "idle"}
              >
                Save Settings
              </Button>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
