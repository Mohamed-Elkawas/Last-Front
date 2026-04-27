"use client"

import type { ReactNode } from "react"
import { useLanguageStore } from "@/lib/app-language-store"
import { defaultLanguage, getLanguageDirection } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

type ClientDirectionShellProps = {
  children: ReactNode
  className?: string
}

export function ClientDirectionShell({ children, className }: ClientDirectionShellProps) {
  const language = useLanguageStore((s) => s.language)
  const hasHydrated = useLanguageStore((s) => s.hasHydrated)
  const dir = hasHydrated ? getLanguageDirection(language) : getLanguageDirection(defaultLanguage)

  return (
    <div dir={dir} className={cn(className)}>
      {children}
    </div>
  )
}
