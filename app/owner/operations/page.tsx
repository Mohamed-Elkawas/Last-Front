"use client"

import { Html5Qrcode } from "html5-qrcode"
import { useEffect, useMemo, useRef, useState } from "react"
import { format, startOfToday } from "date-fns"
import { CheckCircle2, Phone, QrCode, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useOwnerBookings } from "@/hooks/use-owner-bookings"
import type { Booking } from "@/lib/types/booking"

type Lang = "ar" | "en"

const copy = {
  en: {
    title: "Daily Operations",
    subtitle:
      "Confirmed reservations with contact, payment method, and completion tracking.",
    scanQr: "Scan QR Code",
    onPitchToday: "On pitch today",
    onPitchTodayDesc:
      "Confirmed bookings dated today that still need to be closed out after the match.",
    nothingToday: "Nothing scheduled for today.",
    playground: "Playground",
    player: "Player",
    noPhone: "No phone",
    markPlayed: "Mark played",
    completedPlayed: "Completed / played",
    completedDesc: "Bookings already checked in or marked as played.",
    noPlayedYet: "No played matches yet.",
    completed: "Completed",
    scanBookingQr: "Scan Booking QR",
    scanBookingQrDesc:
      "Point the camera at the player QR code to confirm check-in.",
    bookingNotFound: "Booking not found for this QR code.",
    bookingNotConfirmed: "This booking is not confirmed yet.",
    alreadyCheckedIn: "This booking is already checked in.",
    qrNotReady: "QR reader is not ready. Please close and try again.",
    cameraFailed:
      "Camera failed to start. Allow camera permission and try again.",
    bookingFound: "Booking found",
    phone: "Phone",
    field: "Field",
    date: "Date",
    time: "Time",
    amount: "Amount",
    close: "Close",
    confirmCheckIn: "Confirm Check-in",
    currency: "EGP",
  },
  ar: {
    title: "التشغيل اليومي",
    subtitle:
      "تابع الحجوزات المؤكدة، بيانات التواصل، طريقة الدفع، وحالة إنهاء اللعب.",
    scanQr: "مسح كود QR",
    onPitchToday: "حجوزات اليوم",
    onPitchTodayDesc:
      "الحجوزات المؤكدة بتاريخ اليوم والتي تحتاج إلى إنهاء بعد المباراة.",
    nothingToday: "لا توجد حجوزات مجدولة اليوم.",
    playground: "الملعب",
    player: "اللاعب",
    noPhone: "لا يوجد رقم هاتف",
    markPlayed: "تأكيد اللعب",
    completedPlayed: "المكتملة / تم اللعب",
    completedDesc: "الحجوزات التي تم تسجيل حضورها أو تأكيد لعبها.",
    noPlayedYet: "لا توجد مباريات تم لعبها بعد.",
    completed: "مكتمل",
    scanBookingQr: "مسح QR الحجز",
    scanBookingQrDesc:
      "وجّه الكاميرا إلى كود QR الخاص باللاعب لتأكيد الحضور.",
    bookingNotFound: "لم يتم العثور على حجز لهذا الكود.",
    bookingNotConfirmed: "هذا الحجز لم يتم تأكيده بعد.",
    alreadyCheckedIn: "تم تسجيل حضور هذا الحجز بالفعل.",
    qrNotReady: "قارئ QR غير جاهز. أغلق النافذة وحاول مرة أخرى.",
    cameraFailed:
      "فشل تشغيل الكاميرا. اسمح بصلاحية الكاميرا ثم حاول مرة أخرى.",
    bookingFound: "تم العثور على الحجز",
    phone: "الهاتف",
    field: "الملعب",
    date: "التاريخ",
    time: "الوقت",
    amount: "المبلغ",
    close: "إغلاق",
    confirmCheckIn: "تأكيد الحضور",
    currency: "جنيه",
  },
} as const

function playerLabel(booking: Booking, fallback: string) {
  return (
    booking.playerDisplayName?.trim() ||
    booking.payment?.payerName?.trim() ||
    fallback
  )
}

type SlotObject = {
  startTime?: string
  endTime?: string
  slotKey?: string
}

function isSlotObject(value: unknown): value is SlotObject {
  return Boolean(value) && typeof value === "object"
}

function formatSlots(slots: unknown): string {
  if (!slots) return "-"

  const slotList = Array.isArray(slots) ? slots : [slots]

  const formatted = slotList
    .map((slot) => {
      if (typeof slot === "string") return slot

      if (isSlotObject(slot)) {
        if (slot.startTime && slot.endTime) {
          return `${slot.startTime} - ${slot.endTime}`
        }

        if (slot.startTime) return slot.startTime
        if (slot.endTime) return slot.endTime
      }

      return ""
    })
    .filter(Boolean)

  return formatted.length ? formatted.join(", ") : "-"
}

function getPlaygroundName(booking: Booking, fallback: string, lang: Lang) {
  if (lang === "ar") {
    return (
      booking.playground?.name.ar ||
      booking.playground?.name.en ||
      fallback
    )
  }

  return (
    booking.playground?.name.en ||
    booking.playground?.name.ar ||
    fallback
  )
}

export default function OwnerOperationsPage() {
  const { language, hasHydrated } = useAppTranslations()
  const {
    playgroundBookingsForOwner,
    markBookingPlayed,
    hasHydrated: bookingsReady,
  } = useOwnerBookings()

  const lang: Lang = language === "ar" ? "ar" : "en"
  const text = copy[lang]
  const dir = lang === "ar" ? "rtl" : "ltr"

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [scannedBooking, setScannedBooking] = useState<Booking | null>(null)

  const qrRef = useRef<Html5Qrcode | null>(null)
  const isStartingRef = useRef(false)

  const todayStr = format(startOfToday(), "yyyy-MM-dd")

  const todayBookings = useMemo(() => {
    return playgroundBookingsForOwner.filter(
      (booking) =>
        booking.kind === "playground" &&
        booking.playground?.date === todayStr &&
        booking.status === "confirmed" &&
        !booking.playedAt,
    )
  }, [playgroundBookingsForOwner, todayStr])

  const completedBookings = useMemo(() => {
    return playgroundBookingsForOwner.filter(
      (booking) =>
        booking.kind === "playground" &&
        (booking.status === "completed" || Boolean(booking.playedAt)),
    )
  }, [playgroundBookingsForOwner])

  const stopScanner = async () => {
    isStartingRef.current = false

    try {
      if (qrRef.current) {
        await qrRef.current.stop().catch(() => undefined)
        await qrRef.current.clear()
        qrRef.current = null
      }
    } catch {
      qrRef.current = null
    }
  }

  const handleDetectedQr = async (rawValue: string) => {
    const bookingId = rawValue.replace("QR-", "").trim()

    const booking = playgroundBookingsForOwner.find(
      (item) => item.id === bookingId,
    )

    if (!booking) {
      setScannerError(text.bookingNotFound)
      return
    }

    if (booking.status !== "confirmed") {
      setScannerError(text.bookingNotConfirmed)
      return
    }

    if (booking.playedAt) {
      setScannerError(text.alreadyCheckedIn)
      return
    }

    await stopScanner()
    setScannedBooking(booking)
  }

  const startScanner = async () => {
    if (qrRef.current || isStartingRef.current) return

    const readerElement = document.getElementById("qr-reader")

    if (!readerElement) {
      setScannerError(text.qrNotReady)
      return
    }

    isStartingRef.current = true
    setScannerError(null)
    setScannedBooking(null)

    try {
      const qr = new Html5Qrcode("qr-reader")
      qrRef.current = qr

      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await handleDetectedQr(decodedText)
        },
        () => {},
      )
    } catch {
      setScannerError(text.cameraFailed)
      await stopScanner()
    } finally {
      isStartingRef.current = false
    }
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    if (scannerOpen) {
      timer = setTimeout(() => {
        startScanner()
      }, 500)
    } else {
      stopScanner()
    }

    return () => {
      if (timer) clearTimeout(timer)
      stopScanner()
    }
  }, [scannerOpen])

  const confirmCheckIn = () => {
    if (!scannedBooking) return

    markBookingPlayed(scannedBooking.id)
    setScannedBooking(null)
    setScannerOpen(false)
  }

  if (!hasHydrated || !bookingsReady) return null

  return (
    <div dir={dir} className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-start">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            {text.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{text.subtitle}</p>
        </div>

        <Button
          onClick={() => setScannerOpen(true)}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <QrCode className="h-4 w-4" />
          {text.scanQr}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.onPitchToday}</CardTitle>
          <CardDescription>{text.onPitchTodayDesc}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {todayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {text.nothingToday}
            </p>
          ) : (
            todayBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {getPlaygroundName(booking, text.playground, lang)}
                  </p>

                  <p className="text-muted-foreground">
                    {booking.playground?.dateLabel || "-"} ·{" "}
                    {formatSlots(booking.playground?.slots)}
                  </p>

                  <p>
                    <span className="text-muted-foreground">
                      {text.player}:
                    </span>{" "}
                    {playerLabel(booking, text.player)}
                  </p>

                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {booking.playerPhone?.trim() || text.noPhone}
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700">
                  <Checkbox
                    onCheckedChange={(value) => {
                      if (value === true) markBookingPlayed(booking.id)
                    }}
                  />
                  <span>{text.markPlayed}</span>
                </label>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {text.completedPlayed}
          </CardTitle>
          <CardDescription>{text.completedDesc}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {completedBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {text.noPlayedYet}
            </p>
          ) : (
            completedBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {getPlaygroundName(booking, text.playground, lang)}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {playerLabel(booking, text.player)} ·{" "}
                    {booking.playground?.dateLabel || "-"} ·{" "}
                    {formatSlots(booking.playground?.slots)}
                  </p>
                </div>

                <div className="text-end text-sm">
                  <p className="font-semibold">
                    {booking.playground?.total ?? 0} {text.currency}
                  </p>
                  <p className="text-muted-foreground">
                    {booking.playedAt
                      ? new Date(booking.playedAt).toLocaleString(
                          lang === "ar" ? "ar-EG" : "en-US",
                        )
                      : text.completed}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={scannerOpen}
        onOpenChange={(open) => {
          setScannerOpen(open)
          if (!open) {
            setScannedBooking(null)
            setScannerError(null)
          }
        }}
      >
        <DialogContent dir={dir} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{text.scanBookingQr}</DialogTitle>
            <DialogDescription>{text.scanBookingQrDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!scannedBooking && (
              <div
                id="qr-reader"
                className="h-72 w-full overflow-hidden rounded-xl bg-black"
              />
            )}

            {scannerError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <XCircle className="mt-0.5 h-4 w-4" />
                <span>{scannerError}</span>
              </div>
            )}

            {scannedBooking && (
              <div className="space-y-3 rounded-xl border bg-green-50 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  {text.bookingFound}
                </div>

                <p>
                  <strong>{text.player}:</strong>{" "}
                  {playerLabel(scannedBooking, text.player)}
                </p>

                <p>
                  <strong>{text.phone}:</strong>{" "}
                  {scannedBooking.playerPhone?.trim() || text.noPhone}
                </p>

                <p>
                  <strong>{text.field}:</strong>{" "}
                  {getPlaygroundName(scannedBooking, text.playground, lang)}
                </p>

                <p>
                  <strong>{text.date}:</strong>{" "}
                  {scannedBooking.playground?.dateLabel || "-"}
                </p>

                <p>
                  <strong>{text.time}:</strong>{" "}
                  {formatSlots(scannedBooking.playground?.slots)}
                </p>

                <p>
                  <strong>{text.amount}:</strong>{" "}
                  {scannedBooking.playground?.total ?? 0} {text.currency}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScannerOpen(false)}>
              {text.close}
            </Button>

            {scannedBooking && (
              <Button
                onClick={confirmCheckIn}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                {text.confirmCheckIn}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}