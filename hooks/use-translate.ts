"use client"

import { useLanguageStore } from "@/lib/app-language-store"
import { defaultLanguage } from "@/lib/i18n/config"
import { getTranslations, translate } from "@/lib/i18n"

type Params = Record<string, string | number | boolean | null | undefined>

export function useTranslate() {
  const storedLanguage = useLanguageStore((state) => state.language)
  const hasHydrated = useLanguageStore((state) => state.hasHydrated)

  const language = hasHydrated ? storedLanguage : defaultLanguage
  const messages = getTranslations(language)

  return {
    language,
    hasHydrated,
    messages,
    t: (key: string, params?: Params) => translate(language, key, params),
    isArabic: language === "ar",
  }
}