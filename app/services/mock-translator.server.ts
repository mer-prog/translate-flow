export interface TranslationInput {
  title: string;
  body: string;
}

export interface TranslationResult {
  translatedTitle: string;
  translatedBody: string;
}

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  ja: "JA",
};

export async function mockTranslate(
  input: TranslationInput,
  targetLocale: string,
): Promise<TranslationResult> {
  const label = LOCALE_LABELS[targetLocale] ?? targetLocale.toUpperCase();
  return {
    translatedTitle: `[${label}] ${input.title}`,
    translatedBody: `[${label}] ${input.body}`,
  };
}
