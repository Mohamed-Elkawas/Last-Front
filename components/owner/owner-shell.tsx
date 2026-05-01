"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Inbox,
  ClipboardCheck,
  Trophy,
  UserRound,
  LogOut,
  PanelLeft,
  Zap,
  CalendarCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useAuth } from "@/hooks/use-auth"
import { AUTH_ROUTES } from "@/lib/auth/routes"
import { LanguageToggleButton } from "@/components/shared/language-switcher"

const nav = [
  {
    href: "/owner/dashboard",
    key: "ownerShell.navDashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    href: "/owner/bookings",
    key: "ownerShell.navBookings",
    label: "Bookings",
    icon: CalendarCheck,
    end: false,
  },
  {
    href: "/owner/fields",
    key: "ownerShell.navFields",
    label: "Field Management",
    icon: Zap,
    end: false,
  },
  {
    href: "/owner/requests",
    key: "ownerShell.navRequests",
    label: "Requests",
    icon: Inbox,
    end: false,
  },
  {
    href: "/owner/operations",
    key: "ownerShell.navOperations",
    label: "Operations",
    icon: ClipboardCheck,
    end: false,
  },
  {
    href: "/owner/tournaments",
    key: "ownerShell.navTournaments",
    label: "Tournaments",
    icon: Trophy,
    end: false,
  },
  {
    href: "/owner/profile",
    key: "ownerShell.navProfile",
    label: "Venue profile",
    icon: UserRound,
    end: false,
  },
] as const

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const { t, hasHydrated, language } = useAppTranslations()
  const { user, signOut } = useAuth()

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
        {t("common.loading") || "Loading..."}
      </div>
    )
  }

  function getNavLabel(key: string, fallback: string) {
    if (key === "ownerShell.navBookings") {
      return language === "ar" ? "الحجوزات" : "Bookings"
    }

    const value = t(key)
    return value && value !== key ? value : fallback
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 z-40 hidden w-60 flex-col border-e border-border bg-card px-4 py-6 md:flex">
        <div className="mb-8 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("ownerShell.badge") || "Owner Console"}
          </p>

          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {t("ownerShell.productName") || "Venue Control"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {t("ownerShell.tagline") ||
              "Operational view synced with player app state"}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon
            const active = item.end
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {getNavLabel(item.key, item.label)}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-border pt-4">
          <div className="px-2">
            <LanguageToggleButton />
          </div>

          <p className="truncate px-2 text-xs text-muted-foreground">
            {user.fullName}
          </p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:ps-60">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="md:hidden" />

          <div className="hidden md:block" />

          <div className="flex items-center gap-2">

            {/* Language button (يظهر في كل الشاشات) */}
            <div className="md:hidden scale-90 sm:scale-100">
              <LanguageToggleButton />
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={async () => {
                await signOut()
                router.push(AUTH_ROUTES.signIn.owner)
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("common.signOut") || "Sign Out"}
            </Button>
          </div>
        </header>

        <main className="flex-1 bg-muted/30 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-28">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 px-1 py-2 backdrop-blur md:hidden">
        <div
          className="mx-auto grid w-full max-w-7xl"
          style={{
            gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))`,
          }}
        >
          {nav.map((item) => {
            const Icon = item.icon
            const active = item.end
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 text-center text-[9px] font-medium leading-tight sm:text-[10px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="max-w-full truncate px-0.5">
                  {getNavLabel(item.key, item.label)}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}