import { BlockStack, Card, InlineGrid, Text, Box } from "@shopify/polaris";
import { useTranslation } from "../i18n/i18nContext";

interface TranslationPreviewProps {
  productTitle: string;
  originalTitle: string;
  translatedTitle: string;
  originalBody: string;
  translatedBody: string;
  targetLocale: string;
}

export function TranslationPreview({
  productTitle,
  originalTitle,
  translatedTitle,
  originalBody,
  translatedBody,
  targetLocale,
}: TranslationPreviewProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          {productTitle} → {targetLocale.toUpperCase()}
        </Text>
        <InlineGrid columns={2} gap="400">
          <Box>
            <BlockStack gap="200">
              <Text as="h4" variant="headingSm" tone="subdued">
                {t("preview.originalTitle")}
              </Text>
              <Text as="p" variant="bodyMd">
                {originalTitle}
              </Text>
            </BlockStack>
          </Box>
          <Box>
            <BlockStack gap="200">
              <Text as="h4" variant="headingSm">
                {t("preview.translatedTitle")}
              </Text>
              <Text as="p" variant="bodyMd">
                {translatedTitle}
              </Text>
            </BlockStack>
          </Box>
        </InlineGrid>
        <InlineGrid columns={2} gap="400">
          <Box>
            <BlockStack gap="200">
              <Text as="h4" variant="headingSm" tone="subdued">
                {t("preview.originalDescription")}
              </Text>
              <Box
                padding="300"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: originalBody }}
                  style={{ fontSize: "14px" }}
                />
              </Box>
            </BlockStack>
          </Box>
          <Box>
            <BlockStack gap="200">
              <Text as="h4" variant="headingSm">
                {t("preview.translatedDescription")}
              </Text>
              <Box
                padding="300"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: translatedBody }}
                  style={{ fontSize: "14px" }}
                />
              </Box>
            </BlockStack>
          </Box>
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}
