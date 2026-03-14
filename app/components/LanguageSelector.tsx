import { BlockStack, Checkbox, Text } from "@shopify/polaris";
import { useTranslation } from "../i18n/i18nContext";

interface LanguageSelectorProps {
  availableLocales: Array<{ locale: string; name: string }>;
  selectedLocales: string[];
  onChange: (selected: string[]) => void;
}

export function LanguageSelector({
  availableLocales,
  selectedLocales,
  onChange,
}: LanguageSelectorProps) {
  const { t } = useTranslation();

  const handleChange = (locale: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedLocales, locale]);
    } else {
      onChange(selectedLocales.filter((l) => l !== locale));
    }
  };

  return (
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd">
        {t("languageSelector.targetLanguages")}
      </Text>
      {availableLocales.map(({ locale, name }) => (
        <Checkbox
          key={locale}
          label={`${name} (${locale})`}
          checked={selectedLocales.includes(locale)}
          onChange={(checked) => handleChange(locale, checked)}
        />
      ))}
    </BlockStack>
  );
}
