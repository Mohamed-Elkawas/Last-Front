"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { defaultLanguage, I18N_STORAGE_KEY } from "@/lib/i18n/config"

export type AppLanguage = "en" | "ar"

type LanguageStore = {
  language: AppLanguage
  hasHydrated: boolean
  setLanguage: (lang: AppLanguage) => void
  toggleLanguage: () => void
  setHasHydrated: (value: boolean) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: defaultLanguage,
      hasHydrated: false,

      setLanguage: (lang) => set({ language: lang }),

      toggleLanguage: () =>
        set({
          language: get().language === "en" ? "ar" : "en",
        }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: I18N_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)