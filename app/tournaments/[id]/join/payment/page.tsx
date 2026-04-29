"use client"

import { Suspense, useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
  User,
  Wallet,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { useTranslate } from "@/hooks/use-translate"
import { useRequireAuth } from "@/lib/auth/require-auth"
import {
  expireTournamentRegistration,
  getTournamentRegistrationById,
  submitTournamentPayment,
} from "@/lib/services/tournaments.service"

const copy = {
  ar: {
    back: "رجوع",
    details: "التفاصيل",
    payment: "الدفع",
    summary: "ملخص الحجز",
    completePayment: "استكمال الدفع",
    remaining: "الوقت المتبقي:",
    selectedMethod: "طريقة الدفع المختارة",
    payerName: "اسم صاحب التحويل",
    phone: "رقم الهاتف",
    upload: "اضغط لرفع صورة إيصال الدفع",
    uploadHint: "PNG / JPG / JPEG",
    submit: "إرسال الدفع",
    submitting: "جاري الإرسال...",
    secured: "جميع بيانات الدفع مشفرة وآمنة",
    tournament: "البطولة:",
    team: "الفريق:",
    players: "عدد اللاعبين:",
    total: "الإجمالي:",
    notFound: "لم يتم العثور على التسجيل",
    expired: "انتهى وقت الدفع",
    required: "من فضلك أكمل بيانات الدفع",
    loading: "جاري التحميل...",
  },
  en: {
    back: "Back",
    details: "Details",
    payment: "Payment",
    summary: "Booking Summary",
    completePayment: "Complete Payment",
    remaining: "Time remaining:",
    selectedMethod: "Selected payment method",
    payerName: "Payer Name",
    phone: "Phone Number",
    upload: "Upload payment screenshot",
    uploadHint: "PNG / JPG / JPEG",
    submit: "Submit Payment",
    submitting: "Submitting...",
    secured: "All payment data is encrypted and secure",
    tournament: "Tournament:",
    team: "Team:",
    players: "Players:",
    total: "Total:",
    notFound: "Registration not found",
    expired: "Payment time expired",
    required: "Please complete payment data",
    loading: "Loading...",
  },
}

function formatRemaining(ms: number) {
  const safeMs = Math.max(ms, 0)
  const minutes = Math.floor(safeMs / 1000 / 60)
  const seconds = Math.floor((safeMs / 1000) % 60)

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function PaymentContent() {
  const { language } = useTranslate()
  const text = language === "ar" ? copy.ar : copy.en
  const isArabic = language === "ar"

  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, canProceed } = useRequireAuth()

  const tournamentId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined

  const registrationId = searchParams.get("registrationId") || ""
  const method = searchParams.get("method") || "vodafone_cash"

  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    payerName: "",
    payerPhone: "",
    screenshotFile: null as File | null,
  })

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      if (tournamentId) {
        canProceed("tournament_join", { tournamentId })
      }

      setShowAuthDialog(true)
    }
  }, [isAuthenticated, tournamentId, canProceed])

  useEffect(() => {
    if (!registrationId) {
      setLoading(false)
      return
    }

    getTournamentRegistrationById(registrationId)
      .then((data) => {
        setRegistration(data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [registrationId])

  const tournament = registration?.tournament

  const tournamentName =
    tournament?.name?.[language] ||
    tournament?.name?.en ||
    tournament?.name?.ar ||
    "-"

  const venueName =
    tournament?.venueName?.[language] ||
    tournament?.venueName?.en ||
    tournament?.venueName?.ar ||
    "-"

  const scheduleLabel =
    tournament?.scheduleLabel?.[language] ||
    tournament?.scheduleLabel?.en ||
    tournament?.scheduleLabel?.ar ||
    "-"

  const total = tournament?.entryFeePerTeam || 0
  const teamName = registration?.teamName || "-"
  const players = registration?.playersCount || 0

  const expiresAt = registration?.expiresAt
    ? new Date(registration.expiresAt).getTime()
    : 0

const remainingMs = expiresAt ? expiresAt - now : 0
const isExpired = Boolean(expiresAt && remainingMs <= 0)

useEffect(() => {
  if (!registrationId || !expiresAt) return
  if (!isExpired) return

  expireTournamentRegistration(registrationId)
  router.replace("/my-tournaments")
}, [registrationId, expiresAt, isExpired, router])

  const methodLabel = method === "vodafone_cash" ? "Vodafone Cash" : "Instapay"
  const MethodIcon = method === "vodafone_cash" ? Wallet : CreditCard

  const canSubmit = Boolean(
    !isExpired &&
    !submitting &&
    form.payerName.trim() &&
    form.payerPhone.trim() &&
    form.screenshotFile,
  )

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!registrationId || !canSubmit) {
      setError(text.required)
      return
    }
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(form.payerName)) {
      setError("الاسم لازم يكون حروف فقط")
      return
    }

    if (!/^\d{11}$/.test(form.payerPhone)) {
      setError("رقم الهاتف لازم يكون 11 رقم")
      return
    }
    setSubmitting(true)

    try {
      await submitTournamentPayment({
        registrationId,
        paymentMethod: method as any,
        payerName: form.payerName.trim(),
        payerPhone: form.payerPhone.trim(),
        paymentScreenshotUrl: form.screenshotFile?.name || "",
      })

      router.push(
        `/tournaments/${tournamentId}/join/payment-success?registrationId=${registrationId}`,
      )
    } catch (err) {
      console.error(err)
      setError(text.required)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 text-center">
          {text.loading}
        </div>
      </AppShell>
    )
  }

  if (!registration) {
    return (
      <AppShell>
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6 text-center">
          <p>{text.notFound}</p>

          <Button asChild>
            <Link href="/tournaments">
              {isArabic ? "العودة للبطولات" : "Back to tournaments"}
            </Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="min-h-[calc(100vh-4rem)] bg-muted/30 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex justify-end">
            <Button variant="ghost" className="gap-2" asChild>
              <Link href={`/tournaments/${tournamentId}`}>
                {isArabic ? (
                  <ArrowRight className="h-4 w-4" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                {text.back}
              </Link>
            </Button>
          </div>

          <div className="mb-8 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold">
                1
              </span>
              <span className="font-semibold">{text.details}</span>
            </div>

            <div className="h-1 w-40 rounded-full bg-primary" />

            <div className="flex items-center gap-2 text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-white">
                2
              </span>
              <span className="font-semibold">{text.payment}</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-border/70 shadow-sm">
              <CardContent className="p-6">
                <h2 className="mb-6 text-xl font-bold">{text.summary}</h2>

                <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
                  {tournament?.imageUrl ? (
                    <img
                      src={tournament.imageUrl}
                      alt={tournamentName}
                      className="h-44 w-full rounded-xl object-cover"
                    />
                  ) : null}

                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold">{tournamentName}</h3>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{venueName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{scheduleLabel}</span>
                    </div>

                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {text.remaining} {formatRemaining(remainingMs)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="my-6 h-px bg-border" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {text.tournament}
                    </span>
                    <span className="font-semibold">{tournamentName}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{text.team}</span>
                    <span className="font-semibold">{teamName}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {text.players}
                    </span>
                    <span className="font-semibold">{players}</span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex items-center justify-between gap-4 text-lg font-bold">
                    <span>{text.total}</span>
                    <span className="text-primary">EGP {total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 shadow-sm">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold">{text.completePayment}</h1>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="flex h-16 items-center justify-end gap-2 rounded-xl border bg-background px-4 text-lg">
                    <Clock className="h-5 w-5" />
                    <span className="text-muted-foreground">
                      {text.remaining}
                    </span>
                    <strong>{formatRemaining(remainingMs)}</strong>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border bg-background p-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white">
                      <MethodIcon className="h-7 w-7" />
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {text.selectedMethod}
                      </p>
                      <p className="font-bold">{methodLabel}</p>
                    </div>
                  </div>

                  <div className="relative">
                    <User className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-12 rounded-xl pr-10 text-right"
                      placeholder={text.payerName}
                      value={form.payerName}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[0-9٠-٩]/g, "")
                        setForm((prev) => ({
                          ...prev,
                          payerName: value,
                        }))
                      }}
                    />
                  </div>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-12 rounded-xl pr-10 text-right"
                      placeholder={text.phone}
                      value={form.payerPhone}
                      inputMode="numeric"
                      maxLength={11}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 11)
                        setForm((prev) => ({
                          ...prev,
                          payerPhone: value,
                        }))
                      }}
                    />
                  </div>

                  <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/70 bg-primary/5 p-4 text-center text-primary transition hover:bg-primary/10">
                    <Upload className="mb-2 h-6 w-6" />

                    <span className="font-semibold">
                      {form.screenshotFile?.name || text.upload}
                    </span>

                    <span className="mt-1 text-xs text-muted-foreground">
                      {text.uploadHint}
                    </span>

                    <input
                      type="file"
                      hidden
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          screenshotFile: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>

                  {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                  ) : null}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl text-base font-bold"
                    disabled={!canSubmit}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {text.submitting}
                      </>
                    ) : isExpired ? (
                      text.expired
                    ) : (
                      text.submit
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>{text.secured}</span>
          </div>
        </div>
      </main>

      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        cancelHref="/"
      />
    </AppShell>
  )
}

export default function Page() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  )
}