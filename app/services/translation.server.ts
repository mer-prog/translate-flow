import type { TranslationInput, TranslationResult } from "./mock-translator.server";
import { mockTranslate } from "./mock-translator.server";
import { claudeTranslate } from "./claude-translator.server";
import prisma from "../db.server";

export type TranslationMode = "mock" | "claude-api";

export async function translate(
  input: TranslationInput,
  targetLocale: string,
  shop: string,
): Promise<TranslationResult> {
  const settings = await prisma.appSettings.findUnique({ where: { shop } });
  const mode: TranslationMode = (settings?.translationMode as TranslationMode) ?? "mock";

  if (mode === "claude-api") {
    if (!settings?.apiKey) {
      throw new Error("Claude API key is not configured. Please set it in Settings.");
    }
    return claudeTranslate(input, targetLocale, settings.apiKey);
  }

  return mockTranslate(input, targetLocale);
}

export { type TranslationInput, type TranslationResult };
