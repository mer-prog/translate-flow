import type { TranslationInput, TranslationResult } from "./mock-translator.server";

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
};

export async function claudeTranslate(
  input: TranslationInput,
  targetLocale: string,
  apiKey: string,
): Promise<TranslationResult> {
  const targetLanguage = LOCALE_NAMES[targetLocale] ?? targetLocale;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a professional e-commerce product translator. Translate the following product information into ${targetLanguage}. Return ONLY a JSON object with "translatedTitle" and "translatedBody" keys. Do not include any other text.

Product Title: ${input.title}

Product Description:
${input.body}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;

  if (!content) {
    throw new Error("Empty response from Claude API");
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude API response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    translatedTitle: parsed.translatedTitle,
    translatedBody: parsed.translatedBody,
  };
}
