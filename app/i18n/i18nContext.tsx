import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import en from "./en.json";
import ja from "./ja.json";

export type Locale = "en" | "ja";

type TranslationDictionary = typeof en;

const dictionaries: Record<Locale, TranslationDictionary> = { en, ja };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function I18nProvider({
  children,
  defaultLocale = "ja",
}: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(dictionaries[locale], key);
      if (value === undefined) {
        // Fallback to English
        value = getNestedValue(dictionaries.en, key);
      }
      if (value === undefined) {
        return key;
      }
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, paramKey: string) => {
          return params[paramKey] !== undefined
            ? String(params[paramKey])
            : `{${paramKey}}`;
        });
      }
      return value;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
