"use client"

import { QRCodeCanvas } from "qrcode.react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, X, AlertCircle, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AppShell } from "@/components/layout/app-shell"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useBookings } from "@/hooks/use-bookings"
import type { Booking } from "@/lib/types/booking"

interface BookingCardProps {
  booking: Booking
  onCancel: (id: string) => void
  canCancel: (booking: Booking) => boolean
}

function BookingCard({ booking, onCancel, canCancel }: BookingCardProps) {
  const router = useRouter()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const { t, isArabic, language } = useAppTranslations()

  const name =
    booking.kind === "playground"
      ? booking.playground?.name[language] || t("common.playground")
      : booking.tournament?.name[language] || t("common.tournament")

  const location =
    booking.kind === "playground" ? booking.playground?.location[language] : ""

  const date = booking.kind === "playground" ? booking.playground?.dateLabel : ""

  const image =
    booking.kind === "playground"
      ? "/images/playground-1.jpg"
      : "/images/tournament-1.jpg"

  const amount =
    booking.kind === "playground"
      ? booking.playground?.total
      : booking.tournament?.total

  const remainingSeconds = Math.max(
    Math.floor((booking.expiresAt - Date.now()) / 1000),
    0,
  )

  const statusColors: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-800",
    payment_submitted: "bg-blue-100 text-blue-800",
    awaiting_admin_approval: "bg-indigo-100 text-indigo-800",
    pending_review: "bg-indigo-100 text-indigo-800",
    confirmed: "bg-primary text-primary-foreground",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-destructive/10 text-destructive",
    expired: "bg-muted text-muted-foreground",
    rejected: "bg-rose-100 text-rose-800",
  }

  const statusLabels: Record<string, string> = {
    pending_payment: t("bookings.statusPendingPayment"),
    payment_submitted: t("bookings.statusPaymentSubmitted"),
    awaiting_admin_approval: t("bookings.statusAwaitingAdminApproval"),
    pending_review: t("bookings.statusAwaitingAdminApproval"),
    confirmed: t("bookings.statusConfirmed"),
    completed: "Completed",
    cancelled: t("bookings.statusCancelled"),
    expired: t("bookings.statusExpired"),
    rejected: t("bookings.statusRejected"),
  }

  const showAwaitingHint =
    booking.status === "awaiting_admin_approval" ||
    booking.status === "pending_review"

  const showPaymentSubmittedHint = booking.status === "payment_submitted"

  const showQr =
    booking.kind === "playground" &&
    booking.status === "confirmed" &&
    !booking.playedAt

const canContinuePayment =
  booking.status === "pending_payment" &&
  ((booking.kind === "playground" && Boolean(booking.playground?.id)) ||
    (booking.kind === "tournament" && Boolean(booking.tournament?.id)))

 const handleContinuePayment = () => {
  if (booking.status !== "pending_payment") return

  if (booking.kind === "playground" && booking.playground?.id) {
    router.push(
      `/playgrounds/${booking.playground.id}/book/payment?bookingId=${booking.id}`,
    )
    return
  }

  if (booking.kind === "tournament" && booking.tournament?.id) {
    const method =
      booking.paymentMethod === "instapay" ? "instapay" : "vodafone_cash"

    router.push(
      `/tournaments/${booking.tournament.id}/join/payment?registrationId=${booking.id}&method=${method}`,
    )
  }
}

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-32 w-full sm:h-auto sm:w-40">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>

          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{name}</h3>

                  {location && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>

                <Badge className={statusColors[booking.status]}>
                  {statusLabels[booking.status] ?? booking.status}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {date && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{date}</span>
                  </div>
                )}

                {booking.kind === "playground" && booking.playground?.slots && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {booking.playground.slots
                        .map((slot) => `${slot.startTime} - ${slot.endTime}`)
                        .join(", ") || "-"}
                    </span>
                  </div>
                )}

                {booking.kind === "tournament" && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {t("payment.players")}: {booking.tournament?.players}
                    </span>
                  </div>
                )}

                {booking.status === "pending_payment" && (
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {t("bookings.paymentWindowLeft", {
                        time: `${Math.floor(remainingSeconds / 60)}:${String(
                          remainingSeconds % 60,
                        ).padStart(2, "0")}`,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {(showAwaitingHint || showPaymentSubmittedHint) && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {showAwaitingHint
                    ? t("bookings.awaitingOwnerHint")
                    : t("bookings.paymentSubmittedHint")}
                </p>
              )}

              {showQr && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-2 border-green-600 text-green-700 hover:bg-green-50"
                    >
                      <QrCode className="h-4 w-4" />
                      Show QR
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Booking QR Code</DialogTitle>
                      <DialogDescription>
                        Show this code to the field owner for check-in.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-green-600 bg-white p-4">
                        <QRCodeCanvas
                          value={`QR-${booking.id}`}
                          size={180}
                          level="H"
                          includeMargin
                        />
                      </div>

                      <div className="w-full rounded-lg bg-muted px-4 py-2 text-center font-mono text-xs break-all">
                        QR-{booking.id}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-lg font-bold text-primary">
                  {amount ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  {" "}
                  {t("common.egp")}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {canContinuePayment && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={handleContinuePayment}
                  >
                    استكمال الدفع
                  </Button>
                )}

                {canCancel(booking) && (
                  <Dialog
                    open={showCancelDialog}
                    onOpenChange={setShowCancelDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X
                          className={
                            isArabic ? "ml-1.5 h-4 w-4" : "mr-1.5 h-4 w-4"
                          }
                        />
                        {t("bookings.cancel")}
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("bookings.cancelBooking")}</DialogTitle>

                        <DialogDescription>
                          {t("bookings.cancelBookingDescription", {
                            courtName: name,
                            date,
                          })}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />

                        <div className="text-sm">
                          <p className="font-medium text-destructive">
                            {t("bookings.cancellationPolicy")}
                          </p>
                          <p className="text-muted-foreground">
                            {t("bookings.cancellationPolicyDescription")}
                          </p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelDialog(false)}
                        >
                          {t("bookings.keepBooking")}
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => {
                            onCancel(booking.id)
                            setShowCancelDialog(false)
                          }}
                        >
                          {t("bookings.cancelBooking")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BookingsPage() {
  const {
    upcomingBookings,
    pastBookings,
    cancelledBookings,
    hasHydrated,
    cancelBooking,
    clearCancelledBookings,
    isCancelableBooking,
  } = useBookings()

  const { t, hasHydrated: i18nReady } = useAppTranslations()

  if (!hasHydrated || !i18nReady) return null

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t("bookings.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("bookings.subtitle")}
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="gap-2">
              {t("bookings.upcoming")}
              {upcomingBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {upcomingBookings.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="past">{t("bookings.past")}</TabsTrigger>
            <TabsTrigger value="cancelled">{t("bookings.cancelled")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={cancelBooking}
                    canCancel={isCancelableBooking}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {t("bookings.noUpcomingBookings")}
                </h3>

                <p className="mt-2 text-muted-foreground">
                  {t("bookings.bookAPlayground")}
                </p>

                <Button className="mt-4" asChild>
                  <Link href="/playgrounds">
                    {t("bookings.findPlaygrounds")}
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastBookings.length > 0 ? (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={cancelBooking}
                    canCancel={() => false}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {t("bookings.noPastBookings")}
                </h3>

                <p className="mt-2 text-muted-foreground">
                  {t("bookings.completedBookingsAppearHere")}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-6">
            {cancelledBookings.length > 0 ? (
              <>
                <div className="mb-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCancelledBookings}
                  >
                    {t("bookings.clearCancelled")}
                  </Button>
                </div>

                <div className="space-y-4">
                  {cancelledBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onCancel={cancelBooking}
                      canCancel={() => false}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <X className="h-8 w-8 text-muted-foreground" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {t("bookings.noCancelledBookings")}
                </h3>

                <p className="mt-2 text-muted-foreground">
                  {t("bookings.noCancelledBookingsDescription")}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}