"use client"

import { useEffect } from "react"
import { useLanguageStore } from "@/lib/app-language-store"
import { defaultLanguage, getLanguageDirection } from "@/lib/i18n/config"

export function DocumentLanguageSync() {
  const language = useLanguageStore((s) => s.language)
  const hasHydrated = useLanguageStore((s) => s.hasHydrated)

  useEffect(() => {
    const resolved = hasHydrated ? language : defaultLanguage
    const html = document.documentElement
    html.lang = resolved
    html.dir = getLanguageDirection(resolved)
    html.classList.toggle("font-ar", resolved === "ar")
    html.classList.toggle("font-en", resolved === "en")
  }, [language, hasHydrated])

  return null
}
