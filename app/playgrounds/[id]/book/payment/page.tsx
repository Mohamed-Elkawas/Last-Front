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
import { useRequireAuth } from "@/lib/auth/require-auth"
import { useBookingById } from "@/hooks/use-booking-by-id"
import { submitBookingPayment, sweepBookingExpiry } from "@/lib/services/bookings.service"

function PlaygroundPaymentContent() {
  const { t, language } = useTranslate()
  const searchParams = useSearchParams()
  const params = useParams()
  const router = useRouter()
  const playgroundId =
    typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined
  const { isAuthenticated, canProceed } = useRequireAuth()

  const bookingId = searchParams.get("bookingId") || ""
  const { booking, hasHydrated } = useBookingById(bookingId, "playground", playgroundId)
  const method = booking?.paymentMethod ?? "vodafone"
  const playgroundName = booking?.playground?.name[language] || t("common.playground")
  const playgroundLocation = booking?.playground?.location[language] || ""
  const date = booking?.playground?.date || ""
  const dateLabel = booking?.playground?.dateLabel || ""
  const slots = booking?.playground?.slots || ""
  const hours = String(booking?.playground?.hours ?? 1)
  const subtotal = String(booking?.playground?.subtotal ?? 0)
  const pointsDiscount = String(booking?.playground?.pointsDiscount ?? 0)
  const total = String(booking?.playground?.total ?? 0)

  const [isLoading, setIsLoading] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [showAuthDialog, setShowAuthDialog] = useState(() => !isAuthenticated)
  const [formData, setFormData] = useState({
    payerName: "",
    paymentNumber: "",
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
      if (playgroundId) {
        canProceed("playground_book", { playgroundId })
      }
      setShowAuthDialog(true)
    }
  }, [canProceed, isAuthenticated, playgroundId])

  const remainingMs = booking?.expiresAt ? Math.max(booking.expiresAt - now, 0) : 0
  const isExpired = booking?.status === "expired" || remainingMs <= 0
  const isPendingPayment = booking?.status === "pending_payment"
  const isFormDisabled = !isPendingPayment || isExpired
  const hasValidAmount = Number(booking?.playground?.total ?? 0) > 0
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

    router.push(`/playgrounds/payment-submitted?bookingId=${booking.id}`)
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
          <Link href={playgroundId ? `/playgrounds/${playgroundId}/book` : "/playgrounds"}>
            <ArrowLeft className="h-4 w-4 icon-arrow-back" />
            {t("payment.backBooking")}
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("payment.title")}</h1>
          <p className="mt-2 text-muted-foreground">{playgroundName}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t("payment.submitBooking")}</CardTitle>
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
                  isExpired
                    ? "border-destructive/30 bg-destructive/10"
                    : "border-amber-200 bg-amber-50"
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
              <CardTitle>{t("payment.summaryBooking")}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{t("payment.playground")}</span>
                <span className="text-end font-medium">{playgroundName}</span>
              </div>

              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{t("payment.location")}</span>
                <span className="text-end font-medium">{playgroundLocation}</span>
              </div>

              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{t("payment.date")}</span>
                <span className="text-end font-medium">{dateLabel || date}</span>
              </div>

              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{t("payment.slots")}</span>
                <span className="text-end font-medium">{slots || "-"}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("payment.hours")}</span>
                <span>{hours}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("payment.subtotal")}</span>
                <span>{subtotal} {t("common.egp")}</span>
              </div>

              {Number(pointsDiscount) > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>{t("payment.pointsDiscount")}</span>
                  <span>-{pointsDiscount} {t("common.egp")}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("payment.method")}</span>
                <span>{methodTitle}</span>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="font-medium">{t("payment.total")}</span>
                <span className="text-lg font-bold text-primary">{total} {t("common.egp")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} cancelHref="/" />
    </AppShell>
  )
}

export default function PlaygroundPaymentPage() {
  return (
    <Suspense fallback={null}>
      <PlaygroundPaymentContent />
    </Suspense>
  )
}
