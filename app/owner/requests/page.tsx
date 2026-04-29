"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { CheckCircle2, Eye, MapPin, XCircle, ArrowRightCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useOwnerBookings } from "@/hooks/use-owner-bookings"
import type { AppLanguage } from "@/lib/app-language-store"
import type { Booking } from "@/lib/types/booking"

function bookingVenueName(booking: Booking, language: AppLanguage, t: (key: string) => string) {
  if (booking.kind === "playground" && booking.playground) {
    return booking.playground.name[language] || t("common.playground")
  }
  return t("common.playground")
}

function playerLabel(booking: Booking, t: (key: string) => string) {
  const fromBooking = booking.playerDisplayName?.trim()
  if (fromBooking) return fromBooking
  const fromPayment = booking.payment?.payerName?.trim()
  if (fromPayment) return fromPayment
  return t("ownerBookings.unknownPlayer")
}

export default function OwnerRequestsPage() {
  const { t, language, hasHydrated: i18nReady } = useAppTranslations()
  const {
    playgroundBookingsForOwner,
    pendingApprovals,
    pipelineBookings,
    approveBooking,
    rejectBooking,
    requestOwnerReview,
    hasHydrated: bookingsReady,
  } = useOwnerBookings()

  const [tab, setTab] = useState<"pipeline" | "awaiting">("pipeline")
  const [detail, setDetail] = useState<Booking | null>(null)

  const list = useMemo(
    () => (tab === "awaiting" ? pendingApprovals : pipelineBookings),
    [tab, pendingApprovals, pipelineBookings],
  )

  const statusClass: Record<string, string> = {
    pending_payment: "bg-amber-500/20 text-amber-200 border border-amber-500/30",
    payment_submitted: "bg-sky-500/15 text-sky-200 border border-sky-500/25",
    awaiting_admin_approval: "bg-violet-500/15 text-violet-200 border border-violet-500/25",
    confirmed: "bg-emerald-500/15 text-emerald-200",
    cancelled: "bg-rose-500/15 text-rose-200",
    expired: "bg-slate-700 text-slate-300",
    rejected: "bg-rose-600/20 text-rose-100 border border-rose-500/30",
  }

  const statusLabel = (status: string) => {
    const keys: Record<string, string> = {
      pending_payment: "bookings.statusPendingPayment",
      payment_submitted: "bookings.statusPaymentSubmitted",
      awaiting_admin_approval: "bookings.statusAwaitingAdminApproval",
      confirmed: "bookings.statusConfirmed",
      cancelled: "bookings.statusCancelled",
      expired: "bookings.statusExpired",
      rejected: "bookings.statusRejected",
    }
    const key = keys[status]
    return key ? t(key) : status
  }

  const closeDetail = () => setDetail(null)

  if (!i18nReady || !bookingsReady) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{t("ownerRequests.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("ownerRequests.subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "pipeline" | "awaiting")} className="w-full m-auto">
        <TabsList className=" m-auto grid w-full max-w-lg grid-cols-2 bg-muted p-1">
          {/* <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t("ownerRequests.tabPipeline")} ({pipelineBookings.length})
          </TabsTrigger> */}
          <TabsTrigger value="awaiting" className=" bg-primary m-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t("ownerRequests.tabAwaiting")} ({pendingApprovals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6 space-y-4">
          {list.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/40">
              <CardContent className="py-12 text-center text-sm text-slate-500">
                {tab === "awaiting" ? t("ownerBookings.emptyAwaiting") : t("ownerRequests.emptyPipeline")}
              </CardContent>
            </Card>
          ) : (
            list.map((booking) => {
              if (booking.kind !== "playground" || !booking.playground) return null
              const pg = booking.playground
              const venue = bookingVenueName(booking, language, t)
              const loc = pg.location[language]

              return (
                <Card key={booking.id} className="overflow-hidden border-slate-800 bg-slate-900/50">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative h-28 w-full sm:h-auto sm:w-36 shrink-0">
                        <Image src="/images/playground-1.jpg" alt={venue} fill className="object-cover opacity-90" />
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("ownerBookings.columnsVenue")}
                            </p>
                            <CardTitle className="text-lg text-foreground">{venue}</CardTitle>
                            {loc ? (
                              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {loc}
                              </div>
                            ) : null}
                          </div>
                          <Badge className={statusClass[booking.status] ?? "bg-slate-800 text-slate-200"}>
                            {statusLabel(booking.status)}
                          </Badge>
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-muted-foreground">{t("ownerBookings.columnsPlayer")}</p>
                            <p className="font-medium text-foreground">{playerLabel(booking, t)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t("ownerBookings.columnsPrice")}</p>
                            <p className="font-medium text-cyan-300">
                              {pg.total} {t("common.egp")}
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs text-slate-500">{t("ownerBookings.columnsWhen")}</p>
                            <p className="font-medium text-slate-100">{pg.dateLabel}</p>
                            <p className="text-slate-400">
                              {pg.slots
                                ?.map((slot) => `${slot.startTime} - ${slot.endTime}`)
                                .join(", ") || "-"}
                            </p>                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 bg-slate-950/40 text-slate-100"
                            onClick={() => setDetail(booking)}
                          >
                            <Eye className="me-1 h-4 w-4" />
                            {t("ownerBookings.openDetails")}
                          </Button>
                          {booking.status === "payment_submitted" ? (
                            <Button
                              size="sm"
                              className="bg-cyan-600 text-white hover:bg-cyan-500"
                              onClick={() => requestOwnerReview(booking.id)}
                            >
                              <ArrowRightCircle className="me-1 h-4 w-4" />
                              {t("ownerRequests.moveToDecision")}
                            </Button>
                          ) : null}
                          {booking.status === "awaiting_admin_approval" ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-500"
                                onClick={() => approveBooking(booking.id)}
                              >
                                <CheckCircle2 className="me-1 h-4 w-4" />
                                {t("ownerBookings.approve")}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectBooking(booking.id)}>
                                <XCircle className="me-1 h-4 w-4" />
                                {t("ownerBookings.reject")}
                              </Button>
                            </>
                          ) : null}
                          {booking.status === "pending_payment" ? (
                            <Button size="sm" variant="destructive" onClick={() => rejectBooking(booking.id)}>
                              <XCircle className="me-1 h-4 w-4" />
                              {t("ownerRequests.declineRequest")}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={detail !== null} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent className="border-slate-800 bg-[#0b1120] text-slate-100 sm:max-w-md">
          {detail && detail.kind === "playground" && detail.playground ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">{t("ownerBookings.detailsTitle")}</SheetTitle>
                <SheetDescription className="text-slate-400">
                  {bookingVenueName(detail, language, t)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">{t("ownerBookings.columnsPlayer")}</p>
                  <p className="font-medium">{playerLabel(detail, t)}</p>
                </div>
                <div>
                  <p className="text-slate-500">{t("ownerBookings.columnsWhen")}</p>
                  <p>{detail.playground.dateLabel}</p>
                  <p className="text-slate-400">
                    {detail.playground.slots
                      ?.map((slot) => `${slot.startTime} - ${slot.endTime}`)
                      .join(", ") || "-"}
                  </p>                </div>
                <div>
                  <p className="text-slate-500">{t("ownerBookings.columnsPrice")}</p>
                  <p className="text-lg font-bold text-cyan-300">
                    {detail.playground.total} {t("common.egp")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">{t("ownerBookings.columnsStatus")}</p>
                  <Badge className={statusClass[detail.status]}>{statusLabel(detail.status)}</Badge>
                </div>
                {detail.payment ? (
                  <Card className="border-slate-800 bg-slate-900/60">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-white">{t("common.paymentDetails")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 py-0 pb-3 text-sm">
                      <p>
                        <span className="text-slate-500">{t("ownerBookings.payer")}: </span>
                        {detail.payment.payerName}
                      </p>
                      <p>
                        <span className="text-slate-500">{t("payment.number")}: </span>
                        {detail.payment.paymentNumber}
                      </p>
                      <p>
                        <span className="text-slate-500">{t("ownerBookings.reference")}: </span>
                        {detail.payment.transactionReference}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                {detail.status === "payment_submitted" ? (
                  <Button className="bg-cyan-600 text-white" onClick={() => requestOwnerReview(detail.id)}>
                    {t("ownerRequests.moveToDecision")}
                  </Button>
                ) : null}
                {detail.status === "awaiting_admin_approval" ? (
                  <>
                    <Button className="bg-emerald-600 text-white" onClick={() => approveBooking(detail.id)}>
                      {t("ownerBookings.approve")}
                    </Button>
                    <Button variant="destructive" onClick={() => rejectBooking(detail.id)}>
                      {t("ownerBookings.reject")}
                    </Button>
                  </>
                ) : null}
                {detail.status === "pending_payment" ? (
                  <Button variant="destructive" onClick={() => rejectBooking(detail.id)}>
                    {t("ownerRequests.declineRequest")}
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
