"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams, useParams, useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, Upload, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { useTranslate } from "@/hooks/use-translate"
import { useAuth } from "@/hooks/use-auth"
import { useBookingById } from "@/hooks/use-booking-by-id"
import { useRequireAuth } from "@/lib/auth/require-auth"
import { submitBookingPayment, sweepBookingExpiry } from "@/lib/services/bookings.service"

function TournamentPaymentContent() {
  const { t, language } = useTranslate()
  const searchParams = useSearchParams()
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { isAuthenticated, canProceed } = useRequireAuth()
  const tournamentId =
    typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined

  const bookingId = searchParams.get("bookingId") || ""
  const { booking, hasHydrated } = useBookingById(bookingId, "tournament", tournamentId)
  const method = booking?.paymentMethod || "vodafone"
  const teamName = booking?.tournament?.teamName || t("common.team")
  const players = String(booking?.tournament?.players ?? 5)
  const total = String(booking?.tournament?.total ?? 400)
  const tournamentName = booking?.tournament?.name[language] || t("common.tournaments")

  const [isLoading, setIsLoading] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [showAuthDialog, setShowAuthDialog] = useState(() => !isAuthenticated)
  const [formData, setFormData] = useState({
    payerName: user.fullName,
    paymentNumber: user.phoneNumber,
    transactionReference: "",
    screenshotName: "",
  })

  useEffect(() => {
    sweepBookingExpiry()
    const interval = setInterval(() => {
      setNow(Date.now())
      sweepBookingExpiry()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      if (tournamentId) {
        canProceed("tournament_join", { tournamentId })
      }
      setShowAuthDialog(true)
    }
  }, [canProceed, isAuthenticated, tournamentId])

  const remainingMs = booking?.expiresAt ? Math.max(booking.expiresAt - now, 0) : 0
  const isExpired = booking?.status === "expired" || remainingMs <= 0
  const isPendingPayment = booking?.status === "pending_payment"
  const isFormDisabled = !isPendingPayment || isExpired
  const hasValidAmount = Number(booking?.tournament?.total ?? 0) > 0
  const hasValidPaymentMethod = method === "vodafone" || method === "instapay"
  const canSubmitPayment =
    Boolean(booking?.id) &&
    isPendingPayment &&
    !isExpired &&
    hasValidAmount &&
    hasValidPaymentMethod &&
    formData.payerName.trim().length > 0 &&
    formData.paymentNumber.trim().length > 0 &&
    formData.transactionReference.trim().length > 0

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      payerName: user.fullName,
      paymentNumber: prev.paymentNumber || user.phoneNumber,
    }))
  }, [user.fullName, user.phoneNumber])

  const formattedTime = useMemo(() => {
    const totalSeconds = Math.floor(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }, [remainingMs])

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, screenshotName: file.name }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !canSubmitPayment || !booking) return

    setIsLoading(true)
    await submitBookingPayment(booking.id, {
      payerName: formData.payerName.trim(),
      paymentNumber: formData.paymentNumber.trim(),
      transactionReference: formData.transactionReference.trim(),
      screenshotName: formData.screenshotName,
    })
    setIsLoading(false)

    router.push(`/tournaments/payment-success?bookingId=${booking.id}`)
  }

  const methodTitle =
    method === "vodafone" ? t("playgroundBook.vodafoneTitle") : t("playgroundBook.instapayTitle")
  const methodIcon =
    method === "vodafone" ? (
      <Wallet className="h-5 w-5 text-white" />
    ) : (
      <CreditCard className="h-5 w-5 text-white" />
    )

  const receiverText =
    method === "vodafone" ? t("payment.receiverVodafone") : t("payment.receiverInstapay")

  if (!hasHydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AppShell>
    )
  }

  if (!booking) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="font-medium text-foreground">{t("bookings.noUpcomingBookings")}</p>
              <Button asChild>
                <Link href="/bookings">{t("common.myBookings")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href={tournamentId ? `/tournaments/${tournamentId}/join` : "/tournaments"}>
            <ArrowLeft className="h-4 w-4 icon-arrow-back" />
            {t("payment.backJoin")}
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("payment.title")}</h1>
          <p className="mt-2 text-muted-foreground">{tournamentName}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t("payment.submitTournament")}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      method === "vodafone" ? "bg-red-500" : "bg-blue-500"
                    }`}
                  >
                    {methodIcon}
                  </div>
                  <div>
                    <p className="font-medium">{methodTitle}</p>
                    <p className="text-sm text-muted-foreground">{receiverText}</p>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-lg border p-4 ${
                  isExpired ? "border-destructive/30 bg-destructive/10" : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Clock className={`mt-0.5 h-5 w-5 shrink-0 ${isExpired ? "text-destructive" : "text-amber-600"}`} />
                  <div>
                    <p className={`font-medium ${isExpired ? "text-destructive" : "text-amber-800"}`}>
                      {isExpired ? t("payment.timerExpiredTitle") : t("payment.timerActiveTitle")}
                    </p>
                    <p className={`text-sm ${isExpired ? "text-destructive/80" : "text-amber-700"}`}>
                      {isExpired ? t("payment.timerExpiredBody") : t("payment.timerActiveBody", { time: formattedTime })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">{t("payment.manualTitle")}</p>
                    <p className="text-sm text-amber-700">{t("payment.manualBody")}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payerName">{t("payment.payerName")}</Label>
                  <Input
                    id="payerName"
                    placeholder={t("payment.payerPh")}
                    value={formData.payerName}
                    onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentNumber">
                    {method === "vodafone" ? t("payment.walletNumber") : t("payment.instaNumber")}
                  </Label>
                  <Input
                    id="paymentNumber"
                    placeholder={t("payment.numberPh")}
                    value={formData.paymentNumber}
                    onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value })}
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionReference">{t("payment.transRef")}</Label>
                  <Input
                    id="transactionReference"
                    placeholder={t("payment.transPh")}
                    value={formData.transactionReference}
                    onChange={(e) =>
                      setFormData({ ...formData, transactionReference: e.target.value })
                    }
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("payment.screenshot")}</Label>
                  <label
                    className={`flex items-center gap-3 rounded-lg border border-dashed p-4 ${
                      isExpired ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/30"
                    }`}
                  >
                    <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formData.screenshotName || t("payment.screenshotPh")}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      disabled={isFormDisabled}
                    />
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || isFormDisabled || !canSubmitPayment}>
                  {isExpired
                    ? t("payment.expiredCta")
                    : !isPendingPayment
                      ? t("payment.underReviewStatus")
                    : isLoading
                      ? t("payment.submitting")
                      : t("payment.submitCta", { amount: total })}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{t("payment.summaryOrder")}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("payment.tournament")}</span>
                <span className="text-end">{tournamentName}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("payment.team")}</span>
                <span className="text-end">{teamName}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("payment.players")}</span>
                <span className="text-end">{players}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("payment.method")}</span>
                <span className="text-end">{methodTitle}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-medium">{t("payment.total")}</span>
                <span className="text-lg font-bold text-primary">{total} {t("common.egp")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        cancelHref="/"
      />
    </AppShell>
  )
}

export default function TournamentPaymentPage() {
  return (
    <Suspense fallback={null}>
      <TournamentPaymentContent />
    </Suspense>
  )
}
