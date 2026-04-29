"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams, useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { useTranslate } from "@/hooks/use-translate"
import { useRequireAuth } from "@/lib/auth/require-auth"
import { useBookingById } from "@/hooks/use-booking-by-id"
import {
  submitBookingPayment,
  sweepBookingExpiry,
} from "@/lib/services/bookings.service"

function PlaygroundPaymentContent() {
  const { language } = useTranslate()
  const searchParams = useSearchParams()
  const params = useParams()
  const router = useRouter()

  const isArabic = language === "ar"

  const labels = {
    back: isArabic ? "رجوع" : "Back",
    loading: isArabic ? "جاري التحميل..." : "Loading...",
    noBooking: isArabic ? "لم يتم العثور على الحجز" : "No booking found",
    completePayment: isArabic ? "استكمال الدفع" : "Complete Payment",
    timeLeft: isArabic ? "الوقت المتبقي" : "Time left",
    selectedPaymentMethod: isArabic
      ? "طريقة الدفع المختارة"
      : "Selected payment method",
    payerName: isArabic ? "اسم صاحب التحويل" : "Payer name",
    vodafoneNumber: isArabic ? "رقم فودافون كاش" : "Vodafone Cash number",
    instapayNumber: isArabic ? "رقم إنستاباي" : "Instapay number",
    uploadTitle: isArabic
      ? "اضغط لرفع صورة إيصال الدفع"
      : "Click to upload payment receipt",
    uploadHint: "PNG / JPG / JPEG",
    submitVodafone: isArabic
      ? "إرسال دفع فودافون كاش"
      : "Submit Vodafone Cash payment",
    submitInstapay: isArabic
      ? "إرسال دفع إنستاباي"
      : "Submit Instapay payment",
    submitting: isArabic ? "جاري إرسال الدفع..." : "Submitting payment...",
    requiredAlert: isArabic
      ? "من فضلك املأ الاسم والرقم وارفع صورة إيصال الدفع"
      : "Please enter payer name, payment number, and upload the receipt image",
    nameLettersOnly: isArabic
      ? "الاسم لازم يكون حروف فقط"
      : "Name must contain letters only",
    paymentNumberInvalid: isArabic
      ? "رقم الدفع لازم يكون 11 رقم"
      : "Payment number must be exactly 11 digits",
    bookingSummary: isArabic ? "ملخص الحجز" : "Booking summary",
    player: isArabic ? "اللاعب" : "Player",
    phone: isArabic ? "الهاتف" : "Phone",
    email: isArabic ? "الإيميل" : "Email",
    total: isArabic ? "الإجمالي" : "Total",
    egp: isArabic ? "جنيه" : "EGP",
  }

  const playgroundId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined

  const { isAuthenticated, canProceed } = useRequireAuth()
  const bookingId = searchParams.get("bookingId") || ""

  const { booking, hasHydrated } = useBookingById(
    bookingId,
    "playground",
    playgroundId,
  )

  const [isLoading, setIsLoading] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [showAuthDialog, setShowAuthDialog] = useState(() => !isAuthenticated)

  const [payerName, setPayerName] = useState("")
  const [paymentNumber, setPaymentNumber] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"vodafone" | "instapay">(
    "vodafone",
  )

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

  useEffect(() => {
    if (booking?.paymentMethod) {
      setPaymentMethod(booking.paymentMethod)
    }
  }, [booking?.paymentMethod])

  const remainingMs = booking?.expiresAt
    ? Math.max(booking.expiresAt - now, 0)
    : 0

  const isExpired = booking?.status === "expired" || remainingMs <= 0

  const formattedTime = useMemo(() => {
    const totalSeconds = Math.floor(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`
  }, [remainingMs])

  if (!hasHydrated) {
    return <AppShell>{labels.loading}</AppShell>
  }

  if (!booking) {
    return <AppShell>{labels.noBooking}</AppShell>
  }

  if (booking.status !== "pending_payment" || isExpired) {
    router.push("/bookings")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedName = payerName.trim()
    const cleanedNumber = paymentNumber.trim()

    if (!cleanedName || !cleanedNumber || !file) {
      alert(labels.requiredAlert)
      return
    }

    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(cleanedName)) {
      alert(labels.nameLettersOnly)
      return
    }

    if (!/^\d{11}$/.test(cleanedNumber)) {
      alert(labels.paymentNumberInvalid)
      return
    }

    setIsLoading(true)

    try {
      await submitBookingPayment(booking.id, {
        payerName: cleanedName,
        paymentNumber: cleanedNumber,
        transactionReference: "-",
        screenshotName: file.name,
      })

      router.push(`/playgrounds/payment-submitted?bookingId=${booking.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/bookings">
            <ArrowLeft className="h-4 w-4" />
            {labels.back}
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{labels.completePayment}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {labels.timeLeft}: {formattedTime}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">
                    {labels.selectedPaymentMethod}
                  </p>

                  <p className="mt-1 font-semibold">
                    {booking.paymentMethod === "vodafone"
                      ? "Vodafone Cash"
                      : "Instapay"}
                  </p>
                </div>

                <Input
                  placeholder={labels.payerName}
                  value={payerName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[0-9٠-٩]/g, "")
                    setPayerName(value)
                  }}
                />

                <Input
                  placeholder={
                    paymentMethod === "vodafone"
                      ? labels.vodafoneNumber
                      : labels.instapayNumber
                  }
                  value={paymentNumber}
                  inputMode="numeric"
                  maxLength={11}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 11)
                    setPaymentNumber(value)
                  }}
                />

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-3 transition hover:border-emerald-500 hover:bg-emerald-50">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-emerald-600" />

                    <div>
                      <p className="text-sm font-semibold text-emerald-700">
                        {labels.uploadTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {labels.uploadHint}
                      </p>
                    </div>
                  </div>

                  {file && (
                    <span className="max-w-[130px] truncate rounded-full bg-white px-3 py-1 text-xs text-emerald-700">
                      {file.name}
                    </span>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>

                <Button className="w-full" disabled={isLoading}>
                  {isLoading
                    ? labels.submitting
                    : paymentMethod === "vodafone"
                      ? labels.submitVodafone
                      : labels.submitInstapay}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{labels.bookingSummary}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              <p>
                {labels.player}: {booking.playerDisplayName || "-"}
              </p>
              <p>
                {labels.phone}: {booking.playerPhone || "-"}
              </p>
              <p>
                {labels.email}: {booking.playerEmail || "-"}
              </p>

              <hr />

              <p>{booking.playground?.name[language] || "-"}</p>
              <p>{booking.playground?.location[language] || "-"}</p>
              <p>{booking.playground?.dateLabel || "-"}</p>

              <p>
                {booking.playground?.slots
                  ?.map((slot) => `${slot.startTime} - ${slot.endTime}`)
                  .join(", ") || "-"}
              </p>

              <p>
                {labels.total}: {booking.playground?.total ?? 0} {labels.egp}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
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