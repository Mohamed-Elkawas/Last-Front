"use client"

import { useTranslate } from "@/hooks/use-translate"

export function useAppTranslations() {
  const { language, hasHydrated, messages, t, isArabic } = useTranslate()

  return {
    language,
    hasHydrated,
    messages,
    t,
    isArabic,
  }
}