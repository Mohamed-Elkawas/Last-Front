"use client"

import { useMemo, useState } from "react"
import {
  Calendar,
  CheckCircle2,
  CircleAlert,
  Eye,
  UserCheck,
  WalletCards,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTableShell } from "@/features/backoffice/shared/components/data-table-shell"
import { EmptyState } from "@/features/backoffice/shared/components/empty-state"
import { LoadingState } from "@/features/backoffice/shared/components/loading-state"
import { StatusBadge } from "@/features/backoffice/shared/components/status-badge"
import { useOwnerBookings } from "@/features/backoffice/owner/hooks/use-owner-bookings"
import { useAppTranslations } from "@/hooks/use-app-translations"

const filters = [
  { key: "today", value: "today" },
  { key: "upcoming", value: "upcoming" },
  { key: "pending", value: "pending_payment_review" },
  { key: "confirmed", value: "confirmed" },
  { key: "completed", value: "completed" },
  { key: "cancelled", value: "cancelled" },
] as const

type FilterValue = (typeof filters)[number]["value"]

type LocalBookingState = {
  paymentStatus?: string
  checkInStatus?: string
  bookingStatus?: string
}

type Lang = "ar" | "en"

const copy = {
  en: {
    title: "Owner Bookings",
    description:
      "Track daily booking flow, monitor payment progress, and review attendance-related statuses from one operational table.",
    filters: "Filters",
    bookingCode: "Booking Code",
    fieldName: "Field Name",
    customer: "Player / Team",
    startTime: "Start Time",
    endTime: "End Time",
    paymentStatus: "Payment Status",
    amount: "Amount",
    checkInStatus: "Check-in Status",
    bookingStatus: "Booking Status",
    actions: "Actions",
    viewDetails: "View Details",
    checkedIn: "Checked In",
    markAttendance: "Mark Attendance",
    reviewPayment: "Review Payment",
    unableToLoad: "Unable to load bookings",
    noBookings: "No bookings found",
    noBookingsDesc: "There are no bookings matching the selected filter.",
    bookingDetails: "Booking Details",
    paymentReview: "Payment Review",
    codeLabel: "Booking Code",
    field: "Field",
    playerTeam: "Player / Team",
    status: "Status",
    paymentReviewDesc:
      "Review the submitted payment for this booking. This is a frontend-ready action; when the API is ready, replace the local state update with approve/reject payment endpoints.",
    approvePayment: "Approve Payment",
    rejectPayment: "Reject Payment",
    filtersMap: {
      today: "Today",
      upcoming: "Upcoming",
      pending: "Pending",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Canceled",
    },
    statusMap: {
      approved: "Approved",
      confirmed: "Confirmed",
      completed: "Completed",
      checked_in: "Checked In",
      pending: "Pending",
      pending_payment_review: "Pending Review",
      awaiting: "Awaiting",
      late: "Late",
      rejected: "Rejected",
      cancelled: "Canceled",
      no_show_candidate: "No-show Candidate",
      escalated: "Escalated",
      player: "Player",
      team: "Team",
      expired_hold: "Expired Hold",
    },
  },
  ar: {
    title: "حجوزات المالك",
    description:
      "تابع حجوزات اليوم، وراجع حالة الدفع، وسجّل حضور اللاعبين من جدول تشغيلي واحد.",
    filters: "الفلاتر",
    bookingCode: "كود الحجز",
    fieldName: "اسم الملعب",
    customer: "اللاعب / الفريق",
    startTime: "وقت البداية",
    endTime: "وقت النهاية",
    paymentStatus: "حالة الدفع",
    amount: "المبلغ",
    checkInStatus: "حالة الحضور",
    bookingStatus: "حالة الحجز",
    actions: "الإجراءات",
    viewDetails: "عرض التفاصيل",
    checkedIn: "تم تسجيل الحضور",
    markAttendance: "تسجيل الحضور",
    reviewPayment: "مراجعة الدفع",
    unableToLoad: "تعذر تحميل الحجوزات",
    noBookings: "لا توجد حجوزات",
    noBookingsDesc: "لا توجد حجوزات مطابقة للفلتر المحدد.",
    bookingDetails: "تفاصيل الحجز",
    paymentReview: "مراجعة الدفع",
    codeLabel: "كود الحجز",
    field: "الملعب",
    playerTeam: "اللاعب / الفريق",
    status: "الحالة",
    paymentReviewDesc:
      "راجع إثبات الدفع المرسل لهذا الحجز. هذا الإجراء جاهز على الواجهة، وعند تجهيز الـ API استبدل تحديث الحالة المحلي بنقاط اعتماد أو رفض الدفع.",
    approvePayment: "اعتماد الدفع",
    rejectPayment: "رفض الدفع",
    filtersMap: {
      today: "اليوم",
      upcoming: "القادمة",
      pending: "قيد المراجعة",
      confirmed: "مؤكد",
      completed: "مكتمل",
      cancelled: "ملغي",
    },
    statusMap: {
      approved: "معتمد",
      confirmed: "مؤكد",
      completed: "مكتمل",
      checked_in: "حضر",
      pending: "معلق",
      pending_payment_review: "بانتظار مراجعة الدفع",
      awaiting: "بانتظار",
      late: "متأخر",
      rejected: "مرفوض",
      cancelled: "ملغي",
      no_show_candidate: "مرشح لعدم الحضور",
      escalated: "مصعّد",
      player: "لاعب",
      team: "فريق",
      expired_hold: "انتهت مهلة الحجز",
    },
  },
} as const

function PageHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-2 text-start">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">
        {title}
      </h1>
      <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function formatDateTime(value: string, language: Lang) {
  const date = new Date(value)
  const locale = language === "ar" ? "ar-EG" : "en-US"

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getStatusTone(status: string) {
  switch (status) {
    case "approved":
    case "confirmed":
    case "completed":
    case "checked_in":
      return "success"
    case "pending":
    case "pending_payment_review":
    case "awaiting":
    case "late":
      return "warning"
    case "rejected":
    case "cancelled":
    case "no_show_candidate":
      return "danger"
    case "escalated":
      return "info"
    default:
      return "neutral"
  }
}

function fallbackStatusLabel(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export default function OwnerBookingsPage() {
  const { data, isLoading, error } = useOwnerBookings()
  const { language } = useAppTranslations()

  const lang: Lang = language === "ar" ? "ar" : "en"
  const text = copy[lang]
  const isArabic = lang === "ar"

  const [activeFilter, setActiveFilter] = useState<FilterValue>("today")
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<"details" | "payment" | null>(
    null,
  )
  const [localState, setLocalState] = useState<Record<string, LocalBookingState>>(
    {},
  )

  const enhancedBookings = useMemo(() => {
    return data.map((booking) => {
      const local = localState[booking.id]

      return {
        ...booking,
        paymentStatus: local?.paymentStatus ?? booking.paymentStatus,
        checkInStatus: local?.checkInStatus ?? booking.checkInStatus,
        bookingStatus: local?.bookingStatus ?? booking.bookingStatus,
      }
    })
  }, [data, localState])

  const selectedBooking = enhancedBookings.find(
    (booking) => booking.id === selectedBookingId,
  )

  const filteredBookings = useMemo(() => {
    const now = new Date()
    const todayKey = now.toDateString()

    return enhancedBookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime)

      if (activeFilter === "today") {
        return bookingDate.toDateString() === todayKey
      }

      if (activeFilter === "upcoming") {
        return (
          bookingDate > now &&
          booking.bookingStatus !== "completed" &&
          booking.bookingStatus !== "cancelled" &&
          booking.bookingStatus !== "expired_hold"
        )
      }

      return booking.bookingStatus === activeFilter
    })
  }, [activeFilter, enhancedBookings])

  function getStatusLabel(value: string) {
    return (
      text.statusMap[value as keyof typeof text.statusMap] ??
      fallbackStatusLabel(value)
    )
  }

  function renderStatus(value: string) {
    return (
      <StatusBadge label={getStatusLabel(value)} tone={getStatusTone(value)} />
    )
  }

  function openDetails(bookingId: string) {
    setSelectedBookingId(bookingId)
    setActivePanel("details")
  }

  function openPaymentReview(bookingId: string) {
    setSelectedBookingId(bookingId)
    setActivePanel("payment")
  }

  function markAttendance(bookingId: string) {
    setLocalState((current) => ({
      ...current,
      [bookingId]: {
        ...current[bookingId],
        checkInStatus: "checked_in",
      },
    }))
  }

  function approvePayment(bookingId: string) {
    setLocalState((current) => ({
      ...current,
      [bookingId]: {
        ...current[bookingId],
        paymentStatus: "approved",
        bookingStatus: "confirmed",
      },
    }))
    setActivePanel(null)
  }

  function rejectPayment(bookingId: string) {
    setLocalState((current) => ({
      ...current,
      [bookingId]: {
        ...current[bookingId],
        paymentStatus: "rejected",
        bookingStatus: "cancelled",
      },
    }))
    setActivePanel(null)
  }

  const columns = [
    {
      key: "bookingCode",
      header: text.bookingCode,
      render: (booking: (typeof enhancedBookings)[number]) => (
        <span className="font-semibold text-foreground">
          {booking.bookingCode}
        </span>
      ),
    },
    {
      key: "fieldName",
      header: text.fieldName,
      render: (booking: (typeof enhancedBookings)[number]) => (
        <span className="text-sm font-medium text-foreground">
          {booking.fieldName}
        </span>
      ),
    },
    {
      key: "customer",
      header: text.customer,
      render: (booking: (typeof enhancedBookings)[number]) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            {booking.customerName}
          </div>
          <div className="text-xs text-muted-foreground">
            {getStatusLabel(booking.customerType)}
          </div>
        </div>
      ),
    },
    {
      key: "startTime",
      header: text.startTime,
      render: (booking: (typeof enhancedBookings)[number]) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(booking.startTime, lang)}
        </span>
      ),
    },
    {
      key: "endTime",
      header: text.endTime,
      render: (booking: (typeof enhancedBookings)[number]) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(booking.endTime, lang)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: text.paymentStatus,
      render: (booking: (typeof enhancedBookings)[number]) =>
        renderStatus(booking.paymentStatus),
    },
    {
      key: "amount",
      header: text.amount,
      render: (booking: (typeof enhancedBookings)[number]) => (
        <span className="text-sm font-semibold text-foreground">
          {booking.amount.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}{" "}
          {booking.currency}
        </span>
      ),
    },
    {
      key: "checkInStatus",
      header: text.checkInStatus,
      render: (booking: (typeof enhancedBookings)[number]) =>
        renderStatus(booking.checkInStatus),
    },
    {
      key: "bookingStatus",
      header: text.bookingStatus,
      render: (booking: (typeof enhancedBookings)[number]) =>
        renderStatus(booking.bookingStatus),
    },
    {
      key: "actions",
      header: text.actions,
      render: (booking: (typeof enhancedBookings)[number]) => {
        const isCheckedIn = booking.checkInStatus === "checked_in"

        return (
          <div className="flex min-w-[170px] flex-col gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-start gap-2 rounded-xl border-border bg-white text-foreground hover:bg-muted"
              onClick={() => openDetails(booking.id)}
            >
              <Eye className="h-4 w-4" />
              {text.viewDetails}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isCheckedIn}
              className="justify-start gap-2 rounded-xl border-border bg-white text-foreground hover:bg-muted disabled:opacity-60"
              onClick={() => markAttendance(booking.id)}
            >
              <UserCheck className="h-4 w-4" />
              {isCheckedIn ? text.checkedIn : text.markAttendance}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-start gap-2 rounded-xl border-border bg-white text-foreground hover:bg-muted"
              onClick={() => openPaymentReview(booking.id)}
            >
              <WalletCards className="h-4 w-4" />
              {text.reviewPayment}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="mx-auto max-w-7xl space-y-6"
    >
      <PageHeader title={text.title} description={text.description} />

      <Card className="border border-border bg-card text-foreground shadow-sm">
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg text-foreground">
            {text.filters}
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={activeFilter === filter.value ? "default" : "outline"}
                className={
                  activeFilter === filter.value
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-muted text-foreground hover:bg-muted/80"
                }
                onClick={() => setActiveFilter(filter.value)}
              >
                {text.filtersMap[filter.key]}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <LoadingState rows={6} />
          ) : error ? (
            <EmptyState
              icon={CircleAlert}
              title={text.unableToLoad}
              description={error}
            />
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={text.noBookings}
              description={text.noBookingsDesc}
            />
          ) : (
            <DataTableShell
              columns={columns}
              rows={filteredBookings}
              getRowId={(booking) => booking.id}
            />
          )}
        </CardContent>
      </Card>

      {activePanel && selectedBooking && (
        <Card className="border border-border bg-card text-foreground shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-foreground">
                {activePanel === "details"
                  ? text.bookingDetails
                  : text.paymentReview}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {text.codeLabel}: {selectedBooking.bookingCode}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setActivePanel(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-5">
            {activePanel === "details" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {text.field}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.fieldName}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {text.playerTeam}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.customerName}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {text.amount}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.amount.toLocaleString(
                      lang === "ar" ? "ar-EG" : "en-US",
                    )}{" "}
                    {selectedBooking.currency}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {text.startTime}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDateTime(selectedBooking.startTime, lang)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {text.endTime}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDateTime(selectedBooking.endTime, lang)}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {text.status}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {renderStatus(selectedBooking.paymentStatus)}
                    {renderStatus(selectedBooking.checkInStatus)}
                    {renderStatus(selectedBooking.bookingStatus)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    {text.paymentReviewDesc}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => approvePayment(selectedBooking.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {text.approvePayment}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => rejectPayment(selectedBooking.id)}
                  >
                    {text.rejectPayment}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}