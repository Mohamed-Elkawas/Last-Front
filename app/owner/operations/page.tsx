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

type TranslateFn = (
  key: string,
  params?: Record<string, string | number | boolean | null | undefined>
) => string

function playerLabel(booking: Booking, t: TranslateFn) {
  return (
    booking.playerDisplayName?.trim() ||
    booking.payment?.payerName?.trim() ||
    t("ownerBookings.unknownPlayer")
  )
}

export default function OwnerOperationsPage() {
  const { t, hasHydrated } = useAppTranslations()
  const {
    playgroundBookingsForOwner,
    markBookingPlayed,
    hasHydrated: bookingsReady,
  } = useOwnerBookings()

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
        !booking.playedAt
    )
  }, [playgroundBookingsForOwner, todayStr])

  const completedBookings = useMemo(() => {
    return playgroundBookingsForOwner.filter(
      (booking) =>
        booking.kind === "playground" &&
        (booking.status === "completed" || Boolean(booking.playedAt))
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

    const booking = playgroundBookingsForOwner.find((item) => item.id === bookingId)

    if (!booking) {
      setScannerError("Booking not found for this QR code.")
      return
    }

    if (booking.status !== "confirmed") {
      setScannerError("This booking is not confirmed yet.")
      return
    }

    if (booking.playedAt) {
      setScannerError("This booking is already checked in.")
      return
    }

    await stopScanner()
    setScannedBooking(booking)
  }

  const startScanner = async () => {
    if (qrRef.current || isStartingRef.current) return

    const readerElement = document.getElementById("qr-reader")

    if (!readerElement) {
      setScannerError("QR reader is not ready. Please close and try again.")
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
        () => {}
      )
    } catch {
      setScannerError("Camera failed to start. Allow camera permission and try again.")
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
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            {t("ownerOperations.title") || "Daily operations"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ownerOperations.subtitle") ||
              "Confirmed reservations with contact, payment method, and completion tracking."}
          </p>
        </div>

        <Button
          onClick={() => setScannerOpen(true)}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <QrCode className="h-4 w-4" />
          Scan QR Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>On pitch today</CardTitle>
          <CardDescription>
            Confirmed bookings dated today that still need to be closed out after the match.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {todayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled for today.
            </p>
          ) : (
            todayBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {booking.playground?.name.en ||
                      booking.playground?.name.ar ||
                      "Playground"}
                  </p>

                  <p className="text-muted-foreground">
                    {booking.playground?.dateLabel} · {booking.playground?.slots}
                  </p>

                  <p>
                    <span className="text-muted-foreground">Player:</span>{" "}
                    {playerLabel(booking, t)}
                  </p>

                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {booking.playerPhone?.trim() || "No phone"}
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700">
                  <Checkbox
                    onCheckedChange={(value) => {
                      if (value === true) markBookingPlayed(booking.id)
                    }}
                  />
                  <span>Mark played</span>
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
            Completed / played
          </CardTitle>
          <CardDescription>Bookings already checked in or marked as played.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {completedBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No played matches yet.</p>
          ) : (
            completedBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {booking.playground?.name.en ||
                      booking.playground?.name.ar ||
                      "Playground"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {playerLabel(booking, t)} · {booking.playground?.dateLabel} ·{" "}
                    {booking.playground?.slots}
                  </p>
                </div>

                <div className="text-right text-sm">
                  <p className="font-semibold">
                    {booking.playground?.total ?? 0} EGP
                  </p>
                  <p className="text-muted-foreground">
                    {booking.playedAt
                      ? new Date(booking.playedAt).toLocaleString()
                      : "Completed"}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan Booking QR</DialogTitle>
            <DialogDescription>
              Point the camera at the player QR code to confirm check-in.
            </DialogDescription>
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
                  Booking found
                </div>

                <p>
                  <strong>Player:</strong> {playerLabel(scannedBooking, t)}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {scannedBooking.playerPhone?.trim() || "No phone"}
                </p>

                <p>
                  <strong>Field:</strong>{" "}
                  {scannedBooking.playground?.name.en ||
                    scannedBooking.playground?.name.ar}
                </p>

                <p>
                  <strong>Date:</strong> {scannedBooking.playground?.dateLabel}
                </p>

                <p>
                  <strong>Time:</strong> {scannedBooking.playground?.slots}
                </p>

                <p>
                  <strong>Amount:</strong>{" "}
                  {scannedBooking.playground?.total ?? 0} EGP
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScannerOpen(false)}>
              Close
            </Button>

            {scannedBooking && (
              <Button
                onClick={confirmCheckIn}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Check-in
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}