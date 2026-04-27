import type { AppLanguage } from "@/lib/app-language-store"
import { defaultLanguage } from "@/lib/i18n/config"
import { ar } from "@/lib/i18n/locales/ar"
import { appAr  } from "@/lib/i18n/locales/app-ar"
import { en } from "@/lib/i18n/locales/en"
import { appEn } from "@/lib/i18n/locales/app-en"

export const messages = {
  ar: { ...ar, ...appAr },

  en: { ...en, ...appEn },
} as const

export type TranslationMessages = (typeof messages)[typeof defaultLanguage]

type Primitive = string | number | boolean | null | undefined
type Params = Record<string, Primitive>

function getValue(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object" && segment in value) {
      return (value as Record<string, unknown>)[segment]
    }

    return undefined
  }, source)
}

function interpolate(message: string, params?: Params) {
  if (!params) return message

  return message.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key]
    return value === undefined || value === null ? `{${key}}` : String(value)
  })
}

export function getTranslations(language: AppLanguage) {
  return messages[language]
}

export function translate(language: AppLanguage, key: string, params?: Params) {
  const value = getValue(messages[language], key)

  if (typeof value !== "string") {
    return key
  }

  return interpolate(value, params)
}