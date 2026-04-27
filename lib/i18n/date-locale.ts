import type { Locale } from "date-fns"
import { arSA, enUS } from "date-fns/locale"
import type { AppLanguage } from "@/lib/app-language-store"

export function getDateFnsLocale(language: AppLanguage): Locale {
  return language === "ar" ? arSA : enUS
}
