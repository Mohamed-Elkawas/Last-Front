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
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* Left */}
          <div className="flex items-center gap-3">
            <AppLogo />
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Points */}
                <div className="flex h-9 items-center gap-1 rounded-full bg-accent px-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    {pointsBalance}
                  </span>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9" asChild>
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute end-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>

                {/* Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    {/* User */}
                    <div className="px-2 py-2 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || ""} />
                        <AvatarFallback>
                          {user.fullName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.fullName}</span>
                    </div>

                    <DropdownMenuSeparator />

                    {/* Profile */}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t("common.profile")}
                      </Link>
                    </DropdownMenuItem>

                    {/* Language */}
                    <LanguageSwitcher />

                    {/* Settings */}
                    <DropdownMenuItem asChild>
                      <Link href="/notifications/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {t("notifications.settingsTitle")}
                      </Link>
                    </DropdownMenuItem>

                    {/* Favorites */}
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        {t("common.favorites")}
                      </Link>
                    </DropdownMenuItem>

                    {/* My Tournaments */}
                    <DropdownMenuItem asChild>
                      <Link href="/my-tournaments" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        {myTournamentsLabel}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Logout */}
                    <DropdownMenuItem
                      className="text-destructive"
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
                <Button asChild size="sm">
                  <Link href={AUTH_ROUTES.signIn.player}>
                    {t("auth.signIn")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation (Mobile) */}
      {isAuthenticated && (
        <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-card md:hidden">
          <div className="grid grid-cols-4">
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
                    "flex flex-col items-center py-2 text-xs",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}