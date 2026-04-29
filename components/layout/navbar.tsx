"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  User,
  Trophy,
  MapPin,
  Calendar,
  Home,
  Star,
  ClipboardList,
  Menu,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { AppLogo } from "@/components/ui/app-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useTranslate } from "@/hooks/use-translate"
import { LanguageSwitcher, LanguageToggleButton } from "@/components/shared/language-switcher"
import { AUTH_ROUTES } from "@/lib/auth/routes"
import { useNotifications } from "@/hooks/use-notifications"
import { usePoints } from "@/hooks/use-points"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const {
    user,
    hasHydrated: authHasHydrated,
    session,
    isAuthenticated,
    signOut,
    accountType,
  } = useAuth()

  const { unreadCount } = useNotifications()
  const { balance: pointsBalance, hasHydrated: pointsHydrated } = usePoints()
  const { t, hasHydrated: languageHasHydrated } = useTranslate()

  const isOwner = session?.roles.includes("owner") ?? false
  const isOwnerSession = accountType === "owner"

  const ready = authHasHydrated && languageHasHydrated && pointsHydrated
  if (!ready) return null

  const myTournamentsLabel = t("common.myTournaments") || "My Tournaments"

  const navLinks = isOwnerSession
    ? [
        {
          href: AUTH_ROUTES.ownerHome,
          label: t("ownerBookings.navLink"),
          icon: ClipboardList,
        },
      ]
    : [
        { href: "/", label: t("common.home"), icon: Home },
        { href: "/playgrounds", label: t("common.playgrounds"), icon: MapPin },
        { href: "/tournaments", label: t("common.tournaments"), icon: Trophy },
        { href: "/my-tournaments", label: myTournamentsLabel, icon: Trophy },
        { href: "/bookings", label: t("common.myBookings"), icon: Calendar },
      ]

  const bottomNavLinks = isOwnerSession
    ? navLinks
    : navLinks.filter((link) =>
        ["/", "/playgrounds", "/tournaments", "/bookings"].includes(link.href),
      )

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <div className="shrink-0" aria-label={t("common.appName")}>
              <AppLogo />
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(`${link.href}/`))

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-2 sm:px-3">
                  <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />
                  <span className="text-xs font-semibold text-primary sm:text-sm">
                    {pointsBalance.toLocaleString()}
                  </span>
                  <span className="hidden text-sm font-semibold text-primary sm:inline">
                    {t("common.points")}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  asChild
                >
                  <Link
                    href="/notifications"
                    aria-label={t("navbar.unreadNotifications", {
                      count: unreadCount,
                    })}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute end-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-medium text-destructive-foreground">
                        {unreadCount}
                      </span>
                    ) : null}
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label={t("navbar.profileMenu")}
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || ""} alt={user.fullName} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{user.fullName}</span>
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    <div className="md:hidden">
                      {navLinks.map((link) => {
                        const Icon = link.icon

                        return (
                          <DropdownMenuItem key={link.href} asChild>
                            <Link href={link.href} className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {link.label}
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}

                      <DropdownMenuSeparator />
                    </div>

                    {!isOwnerSession ? (
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {t("common.profile")}
                        </Link>
                      </DropdownMenuItem>
                    ) : null}

                    <LanguageSwitcher />

                    <DropdownMenuItem asChild>
                      <Link href="/notifications/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {t("notifications.settingsTitle")}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {!isOwnerSession ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/my-tournaments" className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            {myTournamentsLabel}
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/bookings" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {t("common.myBookings")}
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/favorites" className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            {t("common.favorites")}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : null}

                    {isOwner ? (
                      <DropdownMenuItem asChild>
                        <Link href="/owner" className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          {t("ownerBookings.navLink")}
                        </Link>
                      </DropdownMenuItem>
                    ) : null}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={isSigningOut}
                      onClick={async () => {
                        setIsSigningOut(true)
                        await signOut()
                        router.push("/")
                      }}
                    >
                      {t("common.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <LanguageToggleButton />

                <Button variant="ghost" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" asChild>
                  <Link href={AUTH_ROUTES.signIn.player}>{t("auth.signIn")}</Link>
                </Button>

                <Button size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" asChild>
                  <Link href={AUTH_ROUTES.signUp.player}>{t("auth.createAccount")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {isAuthenticated ? (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
            {bottomNavLinks.map((link) => {
              const Icon = link.icon
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors",
                    isActive
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="max-w-full truncate">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      ) : null}
    </>
  )
}