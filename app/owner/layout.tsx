"use client"

import { useState } from "react"
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
  const { applicationStatus, rejectionMessage, isReady } = useOwnerAccess()
  const { isAuthenticated, accountType, hasHydrated: authReady } = useAuth()
  const { t, hasHydrated: i18nReady } = useAppTranslations()

  const [devBusy, setDevBusy] = useState(false)

  // ⏳ Loading
  if (!isReady || !i18nReady || !authReady) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-muted-foreground">
          {t("common.loading")}
        </div>
      </AppShell>
    )
  }

  // ❌ Not logged in
  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-muted-foreground">
          {t("auth.requiredDescription")}
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

  // ❌ Not owner
  if (accountType !== "owner") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-muted-foreground">
          غير مسموح لهذا الحساب بالدخول إلى لوحة المالك.
        </div>
      </AppShell>
    )
  }

  // 🔄 No application yet
  if (applicationStatus === "none") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-muted-foreground">
          {t("ownerPortal.redirecting")}
        </div>
      </AppShell>
    )
  }

  // ⏳ Pending approval
  if (applicationStatus === "pending") {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle>{t("ownerPortal.pendingTitle")}</CardTitle>
              <CardDescription>
                {t("ownerPortal.pendingBody")}
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
                    await devSimulateAdminApproveOwner()
                    setDevBusy(false)
                  }}
                >
                  {t("ownerPortal.devSimulateApprove")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  // ❌ Rejected
  if (applicationStatus === "rejected") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle>{t("ownerPortal.rejectedTitle")}</CardTitle>
              <CardDescription>
                {rejectionMessage?.trim()
                  ? rejectionMessage
                  : t("ownerPortal.rejectedBodyDefault")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    )
  }

  // ✅ Approved owner → show dashboard/pages
  return (
    <AppShell showNavbar={false}>
      <OwnerShell>{children}</OwnerShell>
    </AppShell>
  )
}