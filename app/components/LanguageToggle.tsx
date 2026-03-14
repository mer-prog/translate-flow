import { Button, InlineStack, Text } from "@shopify/polaris";
import { useTranslation, type Locale } from "../i18n/i18nContext";

export function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  const handleToggle = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return (
    <InlineStack gap="200" blockAlign="center">
      <Text as="span" variant="bodySm" tone="subdued">
        {t("languageToggle.label")}:
      </Text>
      <Button
        size="micro"
        variant={locale === "en" ? "primary" : "secondary"}
        onClick={() => handleToggle("en")}
      >
        EN
      </Button>
      <Button
        size="micro"
        variant={locale === "ja" ? "primary" : "secondary"}
        onClick={() => handleToggle("ja")}
      >
        JA
      </Button>
    </InlineStack>
  );
}
