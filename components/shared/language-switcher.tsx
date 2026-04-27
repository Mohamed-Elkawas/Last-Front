"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguageStore } from "@/lib/app-language-store"
import { useTranslate } from "@/hooks/use-translate"

export function LanguageSwitcher() {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  const { t, hasHydrated } = useTranslate()

  if (!hasHydrated) return null

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center gap-2">
        <Languages className="h-4 w-4" />
        {t("common.language")}
      </DropdownMenuSubTrigger>

      <DropdownMenuSubContent sideOffset={8} className="w-40">
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) => setLanguage(value as "ar" | "en")}
        >
          <DropdownMenuRadioItem value="ar">
            {t("common.arabic")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">
            {t("common.english")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

export function LanguageToggleButton() {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  const { hasHydrated } = useTranslate()

  if (!hasHydrated) return null

  return (
    <Button
      variant="ghost"
      onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
      className="flex items-center gap-2"
    >
      <Languages className="h-4 w-4" />
      {language === "ar" ? "EN" : "AR"}
    </Button>
  )
}