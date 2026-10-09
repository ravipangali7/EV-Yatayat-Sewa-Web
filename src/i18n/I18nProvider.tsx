import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "./en.json";
import ne from "./ne.json";

export type AppLanguage = "en" | "ne";

const STORAGE_KEY = "ev_lang";
const dictionaries: Record<AppLanguage, Record<string, string>> = { en, ne };

interface I18nValue {
  lang: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readLang(): AppLanguage {
  try {
    return localStorage.getItem(STORAGE_KEY) === "ne" ? "ne" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AppLanguage>(readLang);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore private-mode storage failures */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "ne" ? "ne" : "en";
    document.documentElement.dataset.evLang = lang;
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLanguage,
      t: (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key,
    }),
    [lang, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "en" as AppLanguage,
      setLanguage: () => undefined,
      t: (key: string) => dictionaries.en[key] ?? key,
    };
  }
  return ctx;
}
