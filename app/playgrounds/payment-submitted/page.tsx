"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  CreditCard,
  User,
  Phone,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppShell } from "@/components/layout/app-shell"
import { useTranslate } from "@/hooks/use-translate"
import { useBookingById } from "@/hooks/use-booking-by-id"

function PlaygroundPaymentSubmittedContent() {
  const { t, language } = useTranslate()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId") || ""
  const { booking, hasHydrated } = useBookingById(bookingId, "playground")

  const playgroundName = booking?.playground?.name[language] || t("common.playground")
  const playgroundLocation = booking?.playground?.location[language] || t("common.notProvided")
  const dateLabel = booking?.playground?.dateLabel || t("common.notProvided")
  const slots = booking?.playground?.slots || t("common.notProvided")
  const hours = String(booking?.playground?.hours ?? 1)
  const total = String(booking?.playground?.total ?? 0)
  const method = booking?.paymentMethod || "vodafone"
  const payerName = booking?.payment?.payerName || t("common.notProvided")
  const paymentNumber = booking?.payment?.paymentNumber || t("common.notProvided")
  const transactionReference = booking?.payment?.transactionReference || t("common.notProvided")

  const methodLabel =
    method === "vodafone" ? t("playgroundBook.vodafoneTitle") : t("playgroundBook.instapayTitle")
  const MethodIcon = method === "vodafone" ? Wallet : CreditCard

  if (!hasHydrated) return null

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-foreground">{t("successPlayground.title")}</h1>

            <p className="mt-2 text-3xl font-bold text-primary">{t("successPlayground.amountLine", { total })}</p>

            <p className="mt-4 text-muted-foreground">{t("successPlayground.subtitle")}</p>

            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-start">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">{t("successPlayground.statusTitle")}</p>
                  <p className="text-sm text-amber-700">{t("successPlayground.statusBody")}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-muted p-4 text-start">
              <h3 className="font-medium text-foreground">{t("successPlayground.detailsTitle")}</h3>

              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.playground")}:</span>
                  <span className="font-medium">{playgroundName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.location")}:</span>
                  <span className="font-medium">{playgroundLocation}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.date")}:</span>
                  <span className="font-medium">{dateLabel}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.slots")}:</span>
                  <span className="font-medium">{slots}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.hours")}:</span>
                  <span className="font-medium">{hours}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <MethodIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.method")}:</span>
                  <span className="font-medium">{methodLabel}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.payer")}:</span>
                  <span className="font-medium">{payerName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.number")}:</span>
                  <span className="font-medium">{paymentNumber}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("payment.reference")}:</span>
                  <span className="font-medium">{transactionReference}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild>
                <Link href="/bookings">{t("successPlayground.viewBookings")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/playgrounds">{t("successPlayground.backPlaygrounds")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function PlaygroundPaymentSubmittedPage() {
  return (
    <Suspense fallback={null}>
      <PlaygroundPaymentSubmittedContent />
    </Suspense>
  )
}
