import type { AppLanguage } from "@/lib/app-language-store"

export const I18N_STORAGE_KEY = "smart-playground-language"

export const supportedLanguages = ["ar", "en"] as const satisfies readonly AppLanguage[]

export const defaultLanguage: AppLanguage = "ar"

export const languageDirections: Record<AppLanguage, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
}

export function getLanguageDirection(language: AppLanguage) {
  return languageDirections[language]
}