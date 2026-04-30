"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { AppShell } from "@/components/layout/app-shell"
import { OwnerShell } from "@/components/owner/owner-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useOwnerAccess } from "@/hooks/use-owner-access"
import { useAuth } from "@/hooks/use-auth"
import { devSimulateAdminApproveOwner } from "@/lib/services/owner.service"
import { AUTH_ROUTES } from "@/lib/auth/routes"

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const { applicationStatus, rejectionMessage, isReady } = useOwnerAccess()
  const { isAuthenticated, accountType, hasHydrated: authReady } = useAuth()
  const { t, hasHydrated: i18nReady } = useAppTranslations()

  const [devBusy, setDevBusy] = useState(false)

  const ready = isReady && i18nReady && authReady
  const isOwner = isAuthenticated && accountType === "owner"

  useEffect(() => {
    if (!ready) return

    if (isOwner && applicationStatus === "none") {
      router.replace(AUTH_ROUTES.ownerRegister)
    }
  }, [ready, isOwner, applicationStatus, router])

  if (!ready) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-muted-foreground">
          {t("common.loading") || "Loading..."}
        </div>
      </AppShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-muted-foreground">
          {t("auth.requiredDescription") || "Please sign in first."}
        </div>

        <AuthRequiredDialog
          open
          onOpenChange={() => undefined}
          cancelHref="/"
          accountType="owner"
          signUpHref={AUTH_ROUTES.ownerRegister}
        />
      </AppShell>
    )
  }

  if (accountType !== "owner") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-muted-foreground">
          غير مسموح لهذا الحساب بالدخول إلى لوحة المالك.
        </div>
      </AppShell>
    )
  }

  if (applicationStatus === "none") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-muted-foreground">
          {t("ownerPortal.redirecting") || "Redirecting..."}
        </div>
      </AppShell>
    )
  }

  if (applicationStatus === "pending") {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("ownerPortal.pendingTitle") || "Application pending"}
              </CardTitle>
              <CardDescription>
                {t("ownerPortal.pendingBody") ||
                  "Your owner application is waiting for approval."}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {process.env.NODE_ENV === "development" && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={devBusy}
                  onClick={async () => {
                    setDevBusy(true)

                    try {
                      await devSimulateAdminApproveOwner()
                      router.refresh()
                    } finally {
                      setDevBusy(false)
                    }
                  }}
                >
                  {devBusy
                    ? "Approving..."
                    : t("ownerPortal.devSimulateApprove") ||
                      "Dev: simulate approval"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (applicationStatus === "rejected") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("ownerPortal.rejectedTitle") || "Application rejected"}
              </CardTitle>
              <CardDescription>
                {rejectionMessage?.trim()
                  ? rejectionMessage
                  : t("ownerPortal.rejectedBodyDefault") ||
                    "Your owner application was rejected."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell showNavbar={false}>
      <OwnerShell>{children}</OwnerShell>
    </AppShell>
  )
}