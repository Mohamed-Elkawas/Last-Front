"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Trophy, Calendar, Users, Clock, Wallet, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppShell } from "@/components/layout/app-shell"
import { useTranslate } from "@/hooks/use-translate"
import { useBookingById } from "@/hooks/use-booking-by-id"

function JoinPaymentSuccessContent() {
  const { t, language } = useTranslate()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId") || ""
  const { booking, hasHydrated } = useBookingById(bookingId, "tournament")

  const total = String(booking?.tournament?.total ?? searchParams.get("total") ?? "400")
  const tournamentName =
    booking?.tournament?.name[language] ||
    searchParams.get("tournamentName") ||
    t("common.tournament")
  const teamName = booking?.tournament?.teamName || searchParams.get("teamName") || t("common.team")
  const players = String(booking?.tournament?.players ?? searchParams.get("players") ?? "5")
  const method = booking?.paymentMethod || searchParams.get("method") || "vodafone"
  const payerName = booking?.payment?.payerName || searchParams.get("payerName") || t("common.notProvided")
  const paymentNumber =
    booking?.payment?.paymentNumber || searchParams.get("paymentNumber") || t("common.notProvided")
  const transactionReference =
    booking?.payment?.transactionReference ||
    searchParams.get("transactionReference") ||
    t("common.notProvided")

  const methodLabel =
    method === "vodafone" ? t("playgroundBook.vodafoneTitle") : t("playgroundBook.instapayTitle")
  const MethodIcon = method === "vodafone" ? Wallet : CreditCard

  if (!hasHydrated) return null

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-foreground">{t("successTournamentJoin.title")}</h1>
            <p className="mt-2 text-3xl font-bold text-primary">{t("successTournamentJoin.amountLine", { total })}</p>

            <p className="mt-4 text-muted-foreground">{t("successTournamentJoin.subtitle")}</p>

            <div className="mt-6 rounded-lg bg-muted p-4 text-start">
              <h3 className="font-medium text-foreground">{t("successTournamentJoin.detailsTitle")}</h3>

              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.tournament")}:</span>
                  <span className="font-medium">{tournamentName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.team")}:</span>
                  <span className="font-medium">{teamName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.players")}:</span>
                  <span className="font-medium">{players}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <MethodIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.method")}:</span>
                  <span className="font-medium">{methodLabel}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.payer")}:</span>
                  <span className="font-medium">{payerName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.number")}:</span>
                  <span className="font-medium">{paymentNumber}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.reference")}:</span>
                  <span className="font-medium">{transactionReference}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.status")}:</span>
                  <span className="font-medium text-amber-600">{t("payment.underReviewStatus")}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild>
                <Link href="/tournaments">{t("successTournamentJoin.viewTournaments")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">{t("successTournamentJoin.home")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function JoinPaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <JoinPaymentSuccessContent />
    </Suspense>
  )
}
