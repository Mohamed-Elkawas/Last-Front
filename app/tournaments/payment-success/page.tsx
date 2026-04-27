"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Trophy, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppShell } from "@/components/layout/app-shell"
import { useTranslate } from "@/hooks/use-translate"
import { useBookingById } from "@/hooks/use-booking-by-id"

function PaymentSuccessContent() {
  const { t, language } = useTranslate()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId") || ""
  const { booking, hasHydrated } = useBookingById(bookingId, "tournament")
  const total = String(booking?.tournament?.total ?? 400)
  const tournamentName = booking?.tournament?.name[language] || t("common.tournament")
  const teamName = booking?.tournament?.teamName || t("common.team")

  if (!hasHydrated) return null

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-foreground">{t("successTournament.title")}</h1>
            <p className="mt-2 text-3xl font-bold text-primary">{t("successTournament.amountLine", { total })}</p>

            <p className="mt-4 text-muted-foreground">{t("successTournament.subtitle")}</p>

            <div className="mt-6 rounded-lg bg-muted p-4 text-start">
              <h3 className="font-medium text-foreground">{t("successTournament.detailsTitle")}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.tournament")}:</span>
                  <span className="font-medium">{tournamentName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.date")}:</span>
                  <span className="font-medium">{t("common.notProvided")}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.team")}:</span>
                  <span className="font-medium">{teamName}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild>
                <Link href="/tournaments">{t("successTournament.viewTournaments")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">{t("successTournament.home")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
