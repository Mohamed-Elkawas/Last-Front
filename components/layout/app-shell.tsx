"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Navbar } from "./navbar"
import { useLanguageStore } from "@/lib/app-language-store"
import { getLanguageDirection } from "@/lib/i18n/config"
import { useAuth } from "@/hooks/use-auth"

interface AppShellProps {
  children: React.ReactNode
  showNavbar?: boolean
}

const OWNER_HOME = "/owner/dashboard"

const PUBLIC_SAFE_ROUTES = ["/auth"]

function isPublicSafeRoute(pathname: string) {
  return PUBLIC_SAFE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function AppShell({ children, showNavbar = true }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  const { isAuthenticated, accountType, hasHydrated } = useAuth()

  const language = useLanguageStore((state) => state.language)
  const languageHasHydrated = useLanguageStore((state) => state.hasHydrated)

  const dir = languageHasHydrated ? getLanguageDirection(language) : getLanguageDirection("ar")

  const isOwner = isAuthenticated && accountType === "owner"
  const isOwnerRoute = pathname.startsWith("/owner")

  useEffect(() => {
    if (!hasHydrated) return

    if (isOwner && !isOwnerRoute) {
      router.replace(OWNER_HOME)
    }
  }, [hasHydrated, isOwner, isOwnerRoute, router])


  return (
    <div dir={dir} className="min-h-screen bg-background">
      {showNavbar && <Navbar />}
      <main>{children}</main>
    </div>
  )
}