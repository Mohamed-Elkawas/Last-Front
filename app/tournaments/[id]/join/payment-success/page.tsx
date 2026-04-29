"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  Trophy,
  Users,
  Wallet,
  CreditCard,
  Clock,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslate } from "@/hooks/use-translate"
import { getTournamentRegistrationById } from "@/lib/services/tournaments.service"

function Content() {
  const { t, language } = useTranslate()
  const searchParams = useSearchParams()

  const registrationId = searchParams.get("registrationId") || ""
  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!registrationId) {
      setLoading(false)
      return
    }

    getTournamentRegistrationById(registrationId)
      .then(setRegistration)
      .finally(() => setLoading(false))
  }, [registrationId])

  if (loading) {
    return (
      <AppShell>
        <div className="p-6">{t("common.loading")}</div>
      </AppShell>
    )
  }

  if (!registration) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <p>{language === "ar" ? "لم يتم العثور على التسجيل" : "Registration not found"}</p>
        </div>
      </AppShell>
    )
  }

  const tournamentName =
    registration.tournament?.name?.[language] ||
    registration.tournament?.name?.en ||
    registration.tournament?.name?.ar ||
    "Tournament"

  const teamName = registration.teamName || "-"
  const players = registration.playersCount || 0
  const total = registration.tournament?.entryFeePerTeam || 0

  const method = registration.paymentMethod
  const methodLabel = method === "vodafone_cash" ? "Vodafone Cash" : "Instapay"
  const MethodIcon = method === "vodafone_cash" ? Wallet : CreditCard

  const isAr = language === "ar"

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md rounded-2xl text-center shadow-sm">
          <CardContent className="p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>

            <h1 className="mt-6 text-2xl font-bold">
              {isAr ? "تم إرسال الدفع" : "Payment Submitted"}
            </h1>

            <p className="mt-2 text-3xl font-bold text-primary">
              {total} EGP
            </p>

            <p className="mt-4 text-muted-foreground">
              {isAr ? "في انتظار موافقة المالك" : "Waiting for owner approval"}
            </p>

            <div className="mt-6 rounded-xl bg-muted p-4 text-start">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{tournamentName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{teamName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {players} {isAr ? "لاعبين" : "players"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MethodIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{methodLabel}</span>
                </div>

                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>{isAr ? "بانتظار الموافقة" : "Awaiting approval"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild>
                <Link href="/tournaments">
                  {isAr ? "العودة للبطولات" : "Back to tournaments"}
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/">{isAr ? "الرئيسية" : "Home"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  )
}