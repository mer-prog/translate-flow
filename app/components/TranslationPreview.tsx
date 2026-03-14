import { BlockStack, Card, InlineGrid, Text, Box } from "@shopify/polaris";

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
                Original Title
              </Text>
              <Text as="p" variant="bodyMd">
                {originalTitle}
              </Text>
            </BlockStack>
          </Box>
          <Box>
            <BlockStack gap="200">
              <Text as="h4" variant="headingSm">
                Translated Title
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
                Original Description
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
                Translated Description
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
