"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarCheck,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Trophy,
  User,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface OwnerShellProps {
  children: React.ReactNode
}

const ownerNavLinks = [
  {
    href: "/owner/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/owner/bookings",
    label: "Bookings",
    icon: CalendarCheck,
  },
  {
    href: "/owner/fields",
    label: "Field Management",
    icon: Zap,
  },
  {
    href: "/owner/requests",
    label: "Requests",
    icon: FolderKanban,
  },
  {
    href: "/owner/operations",
    label: "Operations",
    icon: ClipboardCheck,
  },
  {
    href: "/owner/tournaments",
    label: "Tournaments",
    icon: Trophy,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function OwnerShell({ children }: OwnerShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/owner/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-black text-primary">
                HAGZAYA
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Owner Panel
              </p>
            </div>
          </Link>

          <Button
            className="h-10 shrink-0 rounded-2xl px-4"
            onClick={async () => {
              await signOut()
              router.push("/")
            }}
          >
            <LogOut className="me-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card lg:hidden">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${ownerNavLinks.length}, minmax(0, 1fr))`,
          }}
        >
          {ownerNavLinks.map((link) => {
            const Icon = link.icon
            const active = isActivePath(pathname, link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-center text-[9px] font-semibold leading-tight",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}