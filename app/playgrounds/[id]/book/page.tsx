"use client"

import { useBookingStore } from "@/lib/booking-store"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  Clock,
  User,
  Phone,
  Check,
  CreditCard,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { format, addDays } from "date-fns"
import { useTranslate } from "@/hooks/use-translate"
import { getDateFnsLocale } from "@/lib/i18n/date-locale"
import { usePlayground } from "@/hooks/use-playgrounds"
import { usePlaygroundBookingSlotDefinitions } from "@/hooks/use-playground-booking-slots"
import { useAuth } from "@/hooks/use-auth"
import { createPlaygroundBooking } from "@/lib/services/bookings.service"
import { usePoints } from "@/hooks/use-points"
import { useRequireAuth } from "@/lib/auth/require-auth"
import type { PaymentMethod } from "@/lib/types/booking"

type PlaygroundBookingDraft = {
  step: number
  selectedDate: string | null
  selectedSlotKeys: string[]
  applyPoints: boolean
  paymentMethod: PaymentMethod
}

const DEFAULT_PLAYGROUND_PAYMENT_METHOD: PaymentMethod = "vodafone"

const BLOCKING_STATUSES = [
  "pending_payment",
  "payment_submitted",
  "awaiting_admin_approval",
  "confirmed",
]

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === "vodafone" || value === "instapay"
}

export default function BookingPage() {
  const params = useParams()
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined

  const router = useRouter()
  const { user } = useAuth()
  const { balance: pointsBalance, hasHydrated: pointsHydrated } = usePoints()
  const { t, language } = useTranslate()
  const { playground, loading: playgroundLoading } = usePlayground(id)
  const { slots: slotDefs, loading: slotsLoading } =
    usePlaygroundBookingSlotDefinitions()
  const dateLocale = useMemo(() => getDateFnsLocale(language), [language])
  const { isAuthenticated, canProceed } = useRequireAuth()
  const rawBookings = useBookingStore((s) => s.bookings)

  const draftStorageKey = id ? `playground-booking-draft:${id}` : null

  const [showAuthDialog, setShowAuthDialog] = useState(() => !isAuthenticated)
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([])
  const [applyPoints, setApplyPoints] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    DEFAULT_PLAYGROUND_PAYMENT_METHOD,
  )

  const dateCards = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 14 }, (_, index) => addDays(today, index))
  }, [])

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""

  const timeSlots = useMemo(() => {
    return slotDefs.map((slot) => {
      const slotKey = `${id ?? ""}_${selectedDateKey}_${slot.startTime}_${slot.endTime}`

      const isBlocked = rawBookings.some((booking) => {
        if (booking.kind !== "playground") return false
        if (booking.playground?.id !== String(id)) return false
        if (booking.playground?.date !== selectedDateKey) return false

        const isExpired =
          booking.status === "pending_payment" &&
          Date.now() > booking.expiresAt

        if (isExpired) return false
        if (!BLOCKING_STATUSES.includes(booking.status)) return false

        return booking.playground?.slotKeys?.includes(slotKey)
      })

      return {
        ...slot,
        slotKey,
        label: `${slot.startTime} - ${slot.endTime}`,
        available: !isBlocked,
      }
    })
  }, [slotDefs, rawBookings, id, selectedDateKey])

  const availableSlotKeys = useMemo(
    () =>
      new Set(
        timeSlots.filter((slot) => slot.available).map((slot) => slot.slotKey),
      ),
    [timeSlots],
  )

  const selectedSlots = useMemo(
    () =>
      timeSlots.filter(
        (slot) =>
          selectedSlotKeys.includes(slot.slotKey) &&
          availableSlotKeys.has(slot.slotKey),
      ),
    [availableSlotKeys, selectedSlotKeys, timeSlots],
  )

  const selectedSlotLabels = useMemo(
    () => selectedSlots.map((slot) => slot.label),
    [selectedSlots],
  )

  const hourlyRate = playground?.price.min ?? 0
  const totalHours = selectedSlots.length
  const subtotal = totalHours * hourlyRate
  const pointsDiscount = applyPoints ? Math.min(pointsBalance, subtotal * 0.2) : 0
  const total = subtotal - pointsDiscount

  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
  const formattedDateLabel = selectedDate
    ? format(selectedDate, "EEEE, d MMMM yyyy", { locale: dateLocale })
    : ""

  const hasSelectedDate = Boolean(selectedDate && formattedDate)
  const hasSelectedSlots = selectedSlots.length > 0
  const hasValidSubtotal = Number.isFinite(subtotal) && subtotal > 0
  const hasValidTotal = Number.isFinite(total) && total > 0
  const hasValidPaymentMethod = isPaymentMethod(paymentMethod)

  const toggleSlot = (slotKey: string) => {
    const slot = timeSlots.find((item) => item.slotKey === slotKey)
    if (!slot?.available) return

    setSelectedSlotKeys((prev) =>
      prev.includes(slotKey)
        ? prev.filter((item) => item !== slotKey)
        : [...prev, slotKey],
    )
  }

  useEffect(() => {
    if (!draftStorageKey || typeof window === "undefined") return

    const rawDraft = window.localStorage.getItem(draftStorageKey)
    if (!rawDraft) return

    try {
      const draft = JSON.parse(rawDraft) as Partial<PlaygroundBookingDraft> & {
        selectedSlots?: string[]
      }

      const restoredDate = draft.selectedDate ? new Date(draft.selectedDate) : null
      const restoredSlotKeys = Array.isArray(draft.selectedSlotKeys)
        ? draft.selectedSlotKeys.filter(
            (slotKey): slotKey is string => typeof slotKey === "string",
          )
        : Array.isArray(draft.selectedSlots)
          ? draft.selectedSlots.filter(
              (slotKey): slotKey is string => typeof slotKey === "string",
            )
          : []

      const restoredPaymentMethod =
        typeof draft.paymentMethod === "string" && isPaymentMethod(draft.paymentMethod)
          ? draft.paymentMethod
          : DEFAULT_PLAYGROUND_PAYMENT_METHOD

      setSelectedDate(
        restoredDate && !Number.isNaN(restoredDate.getTime())
          ? restoredDate
          : null,
      )
      setSelectedSlotKeys(restoredSlotKeys)
      setApplyPoints(Boolean(draft.applyPoints))
      setPaymentMethod(restoredPaymentMethod)
      setStep(
        typeof draft.step === "number" && draft.step >= 1 && draft.step <= 4
          ? draft.step
          : 1,
      )
    } catch {
      window.localStorage.removeItem(draftStorageKey)
    }
  }, [draftStorageKey])

  useEffect(() => {
    if (!isAuthenticated && id) {
      canProceed("playground_book", { playgroundId: id })
      setShowAuthDialog(true)
    }
  }, [canProceed, id, isAuthenticated])

  useEffect(() => {
    setSelectedSlotKeys((prev) =>
      prev.filter((slotKey) => availableSlotKeys.has(slotKey)),
    )
  }, [availableSlotKeys])

  useEffect(() => {
    if (!draftStorageKey || typeof window === "undefined") return

    const draft: PlaygroundBookingDraft = {
      step,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
      selectedSlotKeys,
      applyPoints,
      paymentMethod,
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft))
  }, [
    applyPoints,
    draftStorageKey,
    paymentMethod,
    selectedDate,
    selectedSlotKeys,
    step,
  ])

  useEffect(() => {
    if (step > 1 && !hasSelectedDate) {
      setStep(1)
      return
    }

    if (step > 2 && !hasSelectedSlots) {
      setStep(2)
      return
    }

    if (step > 3 && (!hasValidSubtotal || !hasValidPaymentMethod)) {
      setStep(3)
    }
  }, [
    hasSelectedDate,
    hasSelectedSlots,
    hasValidPaymentMethod,
    hasValidSubtotal,
    step,
  ])

  const handleContinueToPayment = () => {
    if (
      !playground ||
      !id ||
      !hasSelectedDate ||
      !hasSelectedSlots ||
      !hasValidTotal ||
      !hasValidPaymentMethod
    ) {
      if (!hasSelectedDate) {
        setStep(1)
      } else if (!hasSelectedSlots) {
        setStep(2)
      } else {
        setStep(4)
      }

      return
    }

    if (!canProceed("playground_book", { playgroundId: id })) {
      setShowAuthDialog(true)
      return
    }

    if (!user.fullName || !user.phoneNumber) {
      return
    }

    const ownerId =
      "ownerId" in playground && playground.ownerId
        ? String(playground.ownerId)
        : undefined

    const bookingId = createPlaygroundBooking({
      playgroundId: playground.id,
      ownerId,
      playgroundName: playground.name,
      playgroundLocation: playground.location,
      date: formattedDate,
      dateLabel: formattedDateLabel,
      slots: selectedSlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotKey: slot.slotKey,
      })),
      hours: totalHours,
      subtotal,
      pointsDiscount,
      total,
      paymentMethod,
      playerDisplayName: user.fullName,
      playerPhone: user.phoneNumber,
      playerEmail: user.email,
    })

    if (draftStorageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(draftStorageKey)
    }

    router.push(`/playgrounds/${id}/book/payment?bookingId=${bookingId}`)
  }

  if (playgroundLoading || slotsLoading || !playground || !pointsHydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-sm text-muted-foreground">
            {t("common.loading")}
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href="/playgrounds">
            <ArrowLeft className="h-4 w-4 icon-arrow-back" />
            {t("playgroundBook.back")}
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center gap-2 sm:gap-4">
              {[1, 2, 3, 4].map((currentStep) => (
                <div key={currentStep} className="flex items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      step >= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      currentStep
                    )}
                  </div>

                  <span
                    className={`hidden text-sm font-medium sm:inline ${
                      step >= currentStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {currentStep === 1 && t("playgroundBook.stepDate")}
                    {currentStep === 2 && t("playgroundBook.stepTime")}
                    {currentStep === 3 && t("playgroundBook.stepReview")}
                    {currentStep === 4 && t("playgroundBook.stepPayment")}
                  </span>

                  {currentStep < 4 && (
                    <div
                      className={`h-0.5 w-6 sm:w-12 ${
                        step > currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {step === 1 && (
              <Card className="bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="h-5 w-5 text-primary" />
                    {t("playgroundBook.selectDateTitle")}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  {selectedDate && (
                    <div className="rounded-xl bg-accent/50 p-6 text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        {t("common.selectedDate")}
                      </p>

                      <p className="mt-1 text-3xl font-bold text-foreground">
                        {format(selectedDate, "d MMMM yyyy", {
                          locale: dateLocale,
                        })}
                      </p>

                      <p className="mt-1 text-lg text-muted-foreground">
                        {format(selectedDate, "EEEE", { locale: dateLocale })}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-7">
                    {dateCards.map((date, index) => {
                      const isSelected =
                        selectedDate &&
                        format(selectedDate, "yyyy-MM-dd") ===
                          format(date, "yyyy-MM-dd")
                      const isToday = index === 0

                      return (
                        <button
                          key={format(date, "yyyy-MM-dd")}
                          type="button"
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedSlotKeys([])
                          }}
                          className={`flex flex-col items-center rounded-xl border-2 p-4 transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-lg"
                              : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                          }`}
                        >
                          <span
                            className={`text-xs font-medium uppercase ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {format(date, "EEE", { locale: dateLocale })}
                          </span>

                          <span
                            className={`text-2xl font-bold ${
                              isSelected
                                ? "text-primary-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {format(date, "d", { locale: dateLocale })}
                          </span>

                          <span
                            className={`text-xs ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {format(date, "MMM", { locale: dateLocale })}
                          </span>

                          {isToday && (
                            <Badge
                              variant={isSelected ? "secondary" : "default"}
                              className="mt-2 px-1.5 py-0 text-[10px]"
                            >
                              {t("common.today")}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedDate}
                    onClick={() => setStep(2)}
                  >
                    {t("common.continue")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clock className="h-5 w-5 text-primary" />
                    {t("playgroundBook.selectTimeTitle")}
                  </CardTitle>

                  <p className="text-sm text-muted-foreground">
                    {selectedDate &&
                      format(selectedDate, "EEEE, d MMMM yyyy", {
                        locale: dateLocale,
                      })}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {t("playgroundBook.selectTimeHint")}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-primary" />
                      <span>{t("playgroundBook.legendSelected")}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border-2 border-primary bg-white dark:bg-background" />
                      <span>{t("playgroundBook.legendAvailable")}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-destructive/20" />
                      <span>{t("playgroundBook.legendBooked")}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.slotKey}
                        type="button"
                        onClick={() => toggleSlot(slot.slotKey)}
                        disabled={!slot.available}
                        className={`rounded-xl border-2 px-3 py-4 text-sm font-medium transition-all ${
                          selectedSlotKeys.includes(slot.slotKey)
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : slot.available
                              ? "border-border bg-card hover:border-primary hover:bg-accent"
                              : "cursor-not-allowed border-transparent bg-destructive/10 text-muted-foreground line-through"
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>

                  {selectedSlots.length > 0 && (
                    <div className="rounded-xl bg-accent/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("playgroundBook.selectedTime")}
                      </p>

                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {selectedSlotLabels.join(", ")}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(1)}
                    >
                      {t("common.back")}
                    </Button>

                    <Button
                      className="flex-1"
                      size="lg"
                      disabled={selectedSlots.length === 0}
                      onClick={() => setStep(3)}
                    >
                      {t("playgroundBook.continueHours", {
                        count: selectedSlots.length,
                      })}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-5 w-5 text-primary" />
                    {t("playgroundBook.reviewTitle")}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="rounded-xl bg-muted/50 p-5">
                    <h4 className="font-semibold text-foreground">
                      {t("playgroundBook.yourInfo")}
                    </h4>

                    <div className="mt-4 grid gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <User className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {t("playgroundBook.nameLabel")}:
                        </span>
                        <span className="font-medium text-foreground">
                          {user.fullName || "-"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {t("playgroundBook.phoneLabel")}:
                        </span>
                        <span className="font-medium text-foreground">
                          {user.phoneNumber || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-5">
                    <h4 className="font-semibold text-foreground">
                      {t("playgroundBook.bookingDetails")}
                    </h4>

                    <div className="mt-4 grid gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {t("playgroundBook.dateLabel")}:
                        </span>
                        <span className="font-medium text-foreground">
                          {formattedDateLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {t("playgroundBook.timeLabel")}:
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSlotLabels.join(", ") || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border-2 border-primary/20 bg-accent/30 p-5">
                    <Checkbox
                      id="use-points"
                      checked={applyPoints}
                      onCheckedChange={(checked) =>
                        setApplyPoints(Boolean(checked))
                      }
                      className="h-5 w-5"
                    />

                    <Label htmlFor="use-points" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-foreground">
                        {t("playgroundBook.usePointsTitle")}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {t("playgroundBook.usePointsDesc", {
                          points: pointsBalance.toLocaleString(),
                        })}
                      </div>
                    </Label>

                    {applyPoints && (
                      <Badge variant="default" className="bg-primary text-base">
                        -{pointsDiscount} {t("common.egp")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(2)}
                    >
                      {t("common.back")}
                    </Button>

                    <Button
                      className="flex-1"
                      size="lg"
                      disabled={!selectedDate || selectedSlots.length === 0 || subtotal <= 0}
                      onClick={() => setStep(4)}
                    >
                      {t("playgroundBook.proceedPayment")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card className="bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CreditCard className="h-5 w-5 text-primary" />
                    {t("playgroundBook.paymentTitle")}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => {
                      if (isPaymentMethod(value)) {
                        setPaymentMethod(value)
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="vodafone"
                        id="vodafone"
                        className="peer sr-only"
                      />

                      <Label
                        htmlFor="vodafone"
                        className="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500">
                          <Wallet className="h-7 w-7 text-white" />
                        </div>

                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {t("playgroundBook.vodafoneTitle")}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {t("playgroundBook.vodafoneDesc")}
                          </p>
                        </div>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem
                        value="instapay"
                        id="instapay"
                        className="peer sr-only"
                      />

                      <Label
                        htmlFor="instapay"
                        className="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500">
                          <CreditCard className="h-7 w-7 text-white" />
                        </div>

                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {t("playgroundBook.instapayTitle")}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {t("playgroundBook.instapayDesc")}
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(3)}
                    >
                      {t("common.back")}
                    </Button>

                    <Button
                      className="flex-1"
                      size="lg"
                      disabled={
                        !selectedDate ||
                        selectedSlots.length === 0 ||
                        total <= 0 ||
                        !isPaymentMethod(paymentMethod)
                      }
                      onClick={handleContinueToPayment}
                    >
                      {t("playgroundBook.continuePaymentDetails")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-card">
              <CardContent className="p-0">
                <div className="relative h-44 overflow-hidden rounded-t-xl">
                  <Image
                    src={playground.imageUrl}
                    alt={playground.name[language]}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground">
                    {playground.name[language]}
                  </h3>

                  <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {playground.location[language]}
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {playground.rating}
                    </span>
                  </div>

                  <div className="mt-5 border-t pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("playgroundBook.pricePerHour")}
                      </span>

                      <span className="font-medium">
                        {hourlyRate} {t("common.egp")}
                      </span>
                    </div>

                    {selectedSlots.length > 0 && (
                      <>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {t("playgroundBook.hoursSelected")}
                          </span>

                          <span className="font-medium">{totalHours}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {t("common.subtotal")}
                          </span>

                          <span className="font-medium">
                            {subtotal} {t("common.egp")}
                          </span>
                        </div>

                        {applyPoints && pointsDiscount > 0 && (
                          <div className="mt-3 flex items-center justify-between text-primary">
                            <span>{t("playgroundBook.pointsDiscount")}</span>
                            <span>
                              -{pointsDiscount} {t("common.egp")}
                            </span>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                          <span className="text-lg font-bold">
                            {t("playgroundBook.total")}
                          </span>

                          <span className="text-2xl font-bold text-primary">
                            {total} {t("common.egp")}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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