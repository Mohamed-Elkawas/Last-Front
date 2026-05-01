"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useMemo, useState } from "react"
import {
  Banknote,
  BellRing,
  CalendarClock,
  CalendarDays,
  CircleAlert,
  Clock,
  CreditCard,
  MapPin,
  Percent,
  RotateCcw,
  UserRound,
  Users,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { ActionCenterList } from "@/features/backoffice/shared/components/action-center-list"
import { EmptyState } from "@/features/backoffice/shared/components/empty-state"
import { LoadingState } from "@/features/backoffice/shared/components/loading-state"
import { useOwnerBookings } from "@/features/backoffice/owner/hooks/use-owner-bookings"
import { useOwnerOverview } from "@/features/backoffice/owner/hooks/use-owner-overview"

type Period = "daily" | "weekly" | "monthly"
type AppLanguage = "ar" | "en"

type ChartPoint = {
  label: string
  sortValue: number
  value: number
}

type HourPoint = {
  hour: number
  count: number
}

function safeText(value: string | undefined | null, fallback: string) {
  if (!value) return fallback
  if (value.includes(".")) return fallback
  return value
}

function PageHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
        {title}
      </h1>
      <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function formatDateTimeRange(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)

  return `${start.toLocaleDateString()} - ${start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

function formatShortTimeRange(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)

  return `${start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

function isUpcomingVisibleStatus(status?: string) {
  return status === "confirmed"
}

function isRevenueStatus(status?: string) {
  return status === "confirmed" || status === "completed"
}

function isApprovedRevenueBooking(booking: {
  bookingStatus?: string
  paymentStatus?: string
  amount?: number
}) {
  return (
    isRevenueStatus(booking.bookingStatus) &&
    (booking.paymentStatus === "captured" || booking.paymentStatus === "approved") &&
    Number(booking.amount) > 0
  )
}

function getStartOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfWeek(date: Date) {
  const d = getStartOfDay(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  return d
}

function getStartOfMonth(date: Date) {
  const d = getStartOfDay(date)
  d.setDate(1)
  return d
}

function getPeriodRange(period: Period) {
  const now = new Date()
  const start =
    period === "daily"
      ? getStartOfDay(now)
      : period === "weekly"
        ? getStartOfWeek(now)
        : getStartOfMonth(now)

  const end = new Date(start)

  if (period === "daily") end.setDate(end.getDate() + 1)
  if (period === "weekly") end.setDate(end.getDate() + 7)
  if (period === "monthly") end.setMonth(end.getMonth() + 1)

  return { start, end }
}

function getPlayerKey(booking: { customerName?: string; id?: string }) {
  return booking.customerName?.trim().toLowerCase() || booking.id || "unknown-player"
}

function formatCurrency(value: number) {
  return Number.isFinite(value) ? value.toLocaleString() : "0"
}

function formatHour(hour: number) {
  const normalized = ((hour % 24) + 24) % 24
  return `${normalized.toString().padStart(2, "0")}:00`
}

function getRevenueBucket(date: Date, period: Period, locale: string) {
  if (period === "daily") {
    const hour = date.getHours()

    return {
      key: `hour-${hour}`,
      label: formatHour(hour),
      sortValue: hour,
    }
  }

  const startOfDay = getStartOfDay(date)

  return {
    key: startOfDay.toISOString(),
    label: startOfDay.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    }),
    sortValue: startOfDay.getTime(),
  }
}

function buildRevenueTrendPoints<
  T extends { startTime: string; amount: number; bookingStatus?: string },
>(revenueBookings: T[], period: Period, locale: string) {
  const grouped = new Map<string, ChartPoint>()

  revenueBookings.forEach((booking) => {
    const amount = Number(booking.amount) || 0
    if (amount <= 0) return

    const bucket = getRevenueBucket(new Date(booking.startTime), period, locale)
    const current = grouped.get(bucket.key)

    grouped.set(bucket.key, {
      label: bucket.label,
      sortValue: bucket.sortValue,
      value: (current?.value || 0) + amount,
    })
  })

  return Array.from(grouped.values()).sort((a, b) => a.sortValue - b.sortValue)
}

function buildPeakHourPoints<T extends { startTime: string }>(periodBookings: T[]) {
  const grouped = new Map<number, number>()

  periodBookings.forEach((booking) => {
    const hour = new Date(booking.startTime).getHours()
    grouped.set(hour, (grouped.get(hour) || 0) + 1)
  })

  return Array.from(grouped.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour)
}

function getDashboardLabels(isArabic: boolean) {
  return {
    pitchPerformance: isArabic ? "أداء الملعب" : "Pitch Performance",
    executiveDashboard: isArabic ? "لوحة الأداء التنفيذية" : "Executive Dashboard",
    daily: isArabic ? "اليوم" : "Daily",
    weekly: isArabic ? "الأسبوع" : "Weekly",
    monthly: isArabic ? "الشهر" : "Monthly",

    totalRevenue: isArabic ? "إجمالي الإيرادات" : "Total Revenue",
    bookingOccupancy: isArabic ? "نسبة إشغال الحجوزات" : "Booking Occupancy",
    newPlayers: isArabic ? "لاعبون جدد" : "New Players",
    returningPlayers: isArabic ? "لاعبون عائدون" : "Returning Players",
    noDataYet: isArabic ? "لا توجد بيانات بعد" : "No data yet",

    revenueHint: isArabic
      ? "إيراد الحجوزات المؤكدة والمدفوعة فقط"
      : "Confirmed and approved bookings only",
    occupancyHint: isArabic
      ? "محسوبة من الحجوزات المؤكدة والمدفوعة"
      : "Calculated from confirmed paid bookings",
    newPlayersHint: isArabic
      ? "لاعبون ظهروا لأول مرة في هذه الفترة"
      : "Players appearing for the first time in this period",

    revenueTrends: isArabic ? "اتجاهات الإيرادات" : "Revenue Trends",
    revenueSubtitle: isArabic
      ? "نمو الإيرادات خلال الفترة المحددة"
      : "Financial growth over the selected period",

    peakHours: isArabic ? "ساعات الذروة" : "Peak Hours",
    peakSubtitle: isArabic ? "كثافة الحجوزات حسب الساعة" : "Intensity per slot",

    actual: isArabic ? "فعلي" : "Actual",
    target: isArabic ? "مستهدف" : "Target",

    noRevenueData: isArabic
      ? "لا توجد بيانات إيرادات لهذه الفترة"
      : "No revenue data for this period.",

    noPeakData: isArabic
      ? "لا توجد حجوزات مؤكدة ومدفوعة لهذه الفترة"
      : "No confirmed paid booking activity for this period.",

    insight: isArabic ? "تحليل" : "Insight",
    busiestSlot: isArabic ? "أكثر وقت ازدحامًا" : "Busiest slot",
    from: isArabic ? "من" : "of",

    viewRequests: isArabic ? "عرض الطلبات" : "View requests",
    manageFields: isArabic ? "إدارة الملاعب" : "Manage fields",

    allCaughtUp: isArabic ? "كل شيء تحت السيطرة" : "All caught up",
    noActionsDesc: isArabic
      ? "لا توجد طلبات أو مراجعات تحتاج تدخلك الآن."
      : "No requests or reviews need your attention right now.",

    paymentReviewsPending: isArabic ? "مدفوعات تحتاج مراجعة" : "Payment reviews pending",
    noShowCandidates: isArabic ? "حجوزات لم يتم تسجيل حضورها" : "No-show candidates",
    upcomingConfirmedBookings: isArabic ? "حجوزات مؤكدة قادمة" : "Upcoming confirmed bookings",

    requests: isArabic ? "طلبات الحجز" : "Requests",
    operations: isArabic ? "التشغيل اليومي" : "Operations",
    upcomingBookingsLabel: isArabic ? "الحجوزات القادمة" : "Upcoming bookings",
  }
}

function RevenueTrendChart({
  points,
  labels,
}: {
  points: ChartPoint[]
  labels: ReturnType<typeof getDashboardLabels>
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 text-center text-sm text-muted-foreground">
        {labels.noRevenueData}
      </div>
    )
  }

 
  const width = 760
  const height = 280
  const paddingX = 58
  const paddingTop = 34
  const paddingBottom = 42
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingTop - paddingBottom
  const maxValue = Math.max(...points.map((point) => point.value), 1)
  const yTicks = [1, 0.5, 0]

  const getX = (index: number) => {
    if (points.length === 1) return paddingX + chartWidth / 2
    return paddingX + (index / (points.length - 1)) * chartWidth
  }

  const getY = (value: number) => {
    if (maxValue <= 0) return paddingTop + chartHeight
    return paddingTop + chartHeight - (value / maxValue) * chartHeight
  }

  const coordinates = points.map((point, index) => ({
    x: getX(index),
    y: getY(point.value),
    ...point,
  }))

  const straightPath =
    coordinates.length === 1
      ? `M ${paddingX} ${coordinates[0].y} L ${width - paddingX} ${coordinates[0].y}`
      : coordinates
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
          .join(" ")

  const smoothPath =
    coordinates.length <= 1
      ? straightPath
      : coordinates.reduce((path, point, index, items) => {
          if (index === 0) return `M ${point.x} ${point.y}`

          const prev = items[index - 1]
          const controlX = (prev.x + point.x) / 2

          return `${path} Q ${controlX} ${prev.y}, ${point.x} ${point.y}`
        }, "")

  const areaPath =
    coordinates.length === 1
      ? `M ${paddingX} ${coordinates[0].y} L ${width - paddingX} ${coordinates[0].y} L ${width - paddingX} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`
      : `${smoothPath} L ${coordinates[coordinates.length - 1].x} ${height - paddingBottom} L ${coordinates[0].x} ${height - paddingBottom} Z`

  const visibleLabels = coordinates.filter((_, index) => {
    if (coordinates.length <= 4) return true
    return index === 0 || index === coordinates.length - 1
  })

  return (
    <div className="relative overflow-hidden rounded-2xl bg-emerald-50/50 p-2">
      <div className="absolute right-4 top-3 z-10 flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-600" /> {labels.actual}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-200" /> {labels.target}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        role="img"
        aria-label="Revenue trend chart"
      >
        <defs>
          <linearGradient id="revenueTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(22 163 74)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="rgb(22 163 74)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = paddingTop + chartHeight * (1 - tick)
          const value = Math.round(maxValue * tick)

          return (
            <g key={tick}>
              <text x="10" y={y + 4} className="fill-muted-foreground text-[10px]">
                {value.toLocaleString()}
              </text>
              <line
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                className="stroke-emerald-100"
                strokeDasharray="4 8"
              />
            </g>
          )
        })}

        <path d={areaPath} fill="url(#revenueTrendFill)" />
        <path
          d={smoothPath}
          fill="none"
          className="stroke-emerald-700"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coordinates.length > 1 ? (
          <circle
            cx={coordinates[coordinates.length - 1].x}
            cy={coordinates[coordinates.length - 1].y}
            r="4"
            className="fill-emerald-700"
          />
        ) : null}

        {visibleLabels.map((point) => (
          <text
            key={`${point.label}-${point.sortValue}-label`}
            x={point.x}
            y={height - 12}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function PeakHoursChart({
  points,
  labels,
}: {
  points: HourPoint[]
  labels: ReturnType<typeof getDashboardLabels>
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 text-center text-sm text-muted-foreground">
        {labels.noPeakData}
      </div>
    )
  }

  const maxCount = Math.max(...points.map((point) => point.count), 1)
  const busiest = points.reduce((best, point) => (point.count > best.count ? point : best), points[0])

  return (
    <div className="flex h-64 flex-col justify-end gap-4 rounded-2xl bg-emerald-50/50 p-4">
      <div className="flex flex-1 items-end justify-center gap-3 overflow-x-auto">
        {points.map((point) => {
          const height = Math.max(18, (point.count / maxCount) * 150)
          const isBusiest = point.hour === busiest.hour

          return (
            <div key={point.hour} className="flex min-w-8 flex-col items-center gap-2">
              <div
                className={
                  isBusiest
                    ? "w-7 rounded-t-lg bg-emerald-700"
                    : "w-7 rounded-t-lg bg-emerald-200"
                }
                style={{ height }}
                title={`${formatHour(point.hour)} - ${point.count} bookings`}
              />
              <span
                className={
                  isBusiest
                    ? "text-[10px] font-semibold text-emerald-800"
                    : "text-[10px] text-muted-foreground"
                }
              >
                {formatHour(point.hour)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl bg-emerald-100/80 p-3 text-xs text-emerald-950">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-700" />
        {labels.insight}: {labels.busiestSlot} {formatHour(busiest.hour)} -{" "}
        {formatHour(busiest.hour + 1)}
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  value,
  label,
  hint,
  isEmpty,
}: {
  icon: ComponentType<{ className?: string }>
  value: string
  label: string
  hint?: string
  isEmpty?: boolean
}) {
  return (
    <Card className="border-emerald-100 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Icon className="h-4 w-4" />
          </div>

          {isEmpty ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
              Empty
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
              Live
            </span>
          )}
        </div>

        <div
          className={
            isEmpty
              ? "text-2xl font-bold text-slate-400"
              : "text-2xl font-bold text-foreground"
          }
        >
          {value}
        </div>

        <div className="mt-1 text-sm text-muted-foreground">{label}</div>

        {hint ? (
          <div className="mt-3 border-t border-emerald-100 pt-3 text-xs text-muted-foreground">
            {hint}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function OwnerOverviewPage() {
  const overview = useOwnerOverview()
  const bookings = useOwnerBookings()
  const { t, language } = useAppTranslations()

  const [period, setPeriod] = useState<Period>("daily")

  const bookingsList = useMemo(() => bookings.data ?? [], [bookings.data])

  const currentLanguage: AppLanguage = language === "en" ? "en" : "ar"
  const isArabic = currentLanguage === "ar"
  const locale = isArabic ? "ar-EG" : "en-US"
  const labels = getDashboardLabels(isArabic)

  const formatDateRangeLabel = () => {
    const { start, end } = getPeriodRange(period)
    const displayEnd = new Date(end)
    displayEnd.setDate(displayEnd.getDate() - 1)

    if (period === "daily") {
      return start.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }

    if (period === "weekly") {
      return `${start.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
      })} - ${displayEnd.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
      })}`
    }

    return start.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    })
  }

  const { kpis, revenueTrendPoints, peakHourPoints, hasApprovedRevenueBookings } =
    useMemo(() => {
      const { start, end } = getPeriodRange(period)

      const filteredBookings = bookingsList.filter((booking) => {
        const bookingDate = new Date(booking.startTime)
        return bookingDate >= start && bookingDate < end
      })

      const revenueBookings = filteredBookings.filter(isApprovedRevenueBooking)

      const totalRevenue = revenueBookings.reduce(
        (sum, booking) => sum + (Number(booking.amount) || 0),
        0
      )

      const totalBookings = filteredBookings.length

      const occupancy =
        totalBookings > 0 ? (revenueBookings.length / totalBookings) * 100 : 0

      const previousRevenueBookings = bookingsList.filter((booking) => {
        const bookingDate = new Date(booking.startTime)
        return bookingDate < start && isApprovedRevenueBooking(booking)
      })

      const previousPlayers = new Set(previousRevenueBookings.map(getPlayerKey))
      const periodPlayers = new Set(revenueBookings.map(getPlayerKey))

      const newPlayers = Array.from(periodPlayers).filter(
        (player) => !previousPlayers.has(player)
      ).length

      const returningPlayers = Array.from(periodPlayers).filter((player) =>
        previousPlayers.has(player)
      ).length

      const totalUniquePlayers = periodPlayers.size

      const returningPercentage =
        totalUniquePlayers > 0 ? (returningPlayers / totalUniquePlayers) * 100 : 0

      return {
        revenueTrendPoints: buildRevenueTrendPoints(revenueBookings, period, locale),
        peakHourPoints: buildPeakHourPoints(revenueBookings),
        hasApprovedRevenueBookings: revenueBookings.length > 0,
        kpis: {
          totalRevenue,
          occupancy: Math.min(Math.max(occupancy, 0), 100),
          newPlayers,
          returningPlayers,
          returningPercentage,
          totalUniquePlayers,
        },
      }
    }, [bookingsList, locale, period])

  const upcomingBookings = useMemo(() => {
    const now = Date.now()

    return bookingsList
      .filter(
        (booking) =>
          new Date(booking.startTime).getTime() > now &&
          isUpcomingVisibleStatus(booking.bookingStatus)
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      .slice(0, 5)
  }, [bookingsList])

  const actionCenterItems = useMemo(() => {
    const now = Date.now()

    const pendingPaymentReviews = bookingsList.filter(
      (booking) =>
        booking.paymentStatus === "pending" ||
        booking.paymentStatus === "escalated" ||
        booking.bookingStatus === "pending_payment_review"
    )

    const noShowCandidates = bookingsList.filter(
      (booking) => booking.checkInStatus === "no_show_candidate"
    )

    const upcomingConfirmed = bookingsList.filter(
      (booking) =>
        booking.bookingStatus === "confirmed" &&
        new Date(booking.startTime).getTime() > now
    )

    const items = [
      pendingPaymentReviews.length > 0
        ? {
            id: "owner-alert-payments",
            type: "slow_review" as const,
            title: safeText(
              t("ownerOverview.alertPaymentsTitle"),
              labels.paymentReviewsPending
            ),
            description: isArabic
              ? `${pendingPaymentReviews.length} حجز يحتاج مراجعة الدفع.`
              : `${pendingPaymentReviews.length} booking(s) need payment review.`,
            severity: "high" as const,
            status: "open" as const,
            relatedEntityLabel: labels.requests,
            createdAt: new Date().toISOString(),
          }
        : null,

      noShowCandidates.length > 0
        ? {
            id: "owner-alert-no-show",
            type: "anomaly" as const,
            title: safeText(
              t("ownerOverview.alertNoShowTitle"),
              labels.noShowCandidates
            ),
            description: isArabic
              ? `${noShowCandidates.length} حجز مر وقته بدون تسجيل حضور.`
              : `${noShowCandidates.length} booking(s) passed without check-in.`,
            severity: "medium" as const,
            status: "open" as const,
            relatedEntityLabel: labels.operations,
            createdAt: new Date().toISOString(),
          }
        : null,

      upcomingConfirmed.length > 0
        ? {
            id: "owner-alert-upcoming",
            type: "anomaly" as const,
            title: labels.upcomingConfirmedBookings,
            description: isArabic
              ? `${upcomingConfirmed.length} حجز مؤكد قادم.`
              : `${upcomingConfirmed.length} confirmed booking(s) coming up.`,
            severity: "low" as const,
            status: "acknowledged" as const,
            relatedEntityLabel: labels.upcomingBookingsLabel,
            createdAt: new Date().toISOString(),
          }
        : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null)

    const priority = {
      high: 3,
      medium: 2,
      low: 1,
    }

    return items.sort((a, b) => priority[b.severity] - priority[a.severity])
  }, [bookingsList, isArabic, labels, t])

  const isLoading = overview.isLoading || bookings.isLoading
  const error = overview.error || bookings.error

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={safeText(t("ownerOverview.title"), "Owner Dashboard")}
        description={safeText(
          t("ownerOverview.description"),
          "Track bookings, revenue, field activity, and important owner actions."
        )}
      />

      {isLoading ? (
        <LoadingState rows={6} />
      ) : error ? (
        <EmptyState
          icon={CircleAlert}
          title={safeText(t("ownerOverview.unableToLoad"), "Unable to load dashboard")}
          description={String(error)}
        />
      ) : (
        <>
          <Card className="border-emerald-100 bg-emerald-50/20">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
                    {labels.pitchPerformance}
                  </p>
                  <CardTitle className="mt-2 text-2xl font-bold text-foreground">
                    {labels.executiveDashboard}
                  </CardTitle>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-xl border border-emerald-100 bg-emerald-50 p-1">
                    <Button
                      size="sm"
                      variant={period === "daily" ? "default" : "ghost"}
                      className={
                        period === "daily"
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "text-emerald-950 hover:bg-emerald-100"
                      }
                      onClick={() => setPeriod("daily")}
                    >
                      {labels.daily}
                    </Button>
                    <Button
                      size="sm"
                      variant={period === "weekly" ? "default" : "ghost"}
                      className={
                        period === "weekly"
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "text-emerald-950 hover:bg-emerald-100"
                      }
                      onClick={() => setPeriod("weekly")}
                    >
                      {labels.weekly}
                    </Button>
                    <Button
                      size="sm"
                      variant={period === "monthly" ? "default" : "ghost"}
                      className={
                        period === "monthly"
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "text-emerald-950 hover:bg-emerald-100"
                      }
                      onClick={() => setPeriod("monthly")}
                    >
                      {labels.monthly}
                    </Button>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950">
                    <CalendarDays className="h-4 w-4" />
                    {formatDateRangeLabel()}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  icon={Banknote}
                  value={
                    hasApprovedRevenueBookings
                      ? `${formatCurrency(kpis.totalRevenue)} EGP`
                      : "--"
                  }
                  label={labels.totalRevenue}
                  hint={hasApprovedRevenueBookings ? labels.revenueHint : labels.noDataYet}
                  isEmpty={!hasApprovedRevenueBookings}
                />

                <KpiCard
                  icon={Percent}
                  value={
                    hasApprovedRevenueBookings ? `${kpis.occupancy.toFixed(1)}%` : "--"
                  }
                  label={labels.bookingOccupancy}
                  hint={hasApprovedRevenueBookings ? labels.occupancyHint : labels.noDataYet}
                  isEmpty={!hasApprovedRevenueBookings}
                />

                <KpiCard
                  icon={Users}
                  value={hasApprovedRevenueBookings ? String(kpis.newPlayers) : "--"}
                  label={labels.newPlayers}
                  hint={hasApprovedRevenueBookings ? labels.newPlayersHint : labels.noDataYet}
                  isEmpty={!hasApprovedRevenueBookings}
                />

                <KpiCard
                  icon={RotateCcw}
                  value={
                    hasApprovedRevenueBookings
                      ? `${kpis.returningPercentage.toFixed(1)}%`
                      : "--"
                  }
                  label={labels.returningPlayers}
                  hint={
                    hasApprovedRevenueBookings
                      ? `${kpis.returningPlayers} ${labels.from} ${kpis.totalUniquePlayers}`
                      : labels.noDataYet
                  }
                  isEmpty={!hasApprovedRevenueBookings}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.7fr_0.8fr]">
                <Card className="border-emerald-100 bg-emerald-50/30">
                  <CardHeader>
                    <CardTitle className="text-base">{labels.revenueTrends}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {labels.revenueSubtitle}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <RevenueTrendChart points={revenueTrendPoints} labels={labels} />
                  </CardContent>
                </Card>

                <Card className="border-emerald-100 bg-emerald-50/30">
                  <CardHeader>
                    <CardTitle className="text-base">{labels.peakHours}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {labels.peakSubtitle}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <PeakHoursChart points={peakHourPoints} labels={labels} />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {actionCenterItems.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="space-y-4 p-6">
                  <EmptyState
                    icon={BellRing}
                    title={labels.allCaughtUp}
                    description={labels.noActionsDesc}
                  />
                  <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/owner/requests">{labels.viewRequests}</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ActionCenterList
                title={safeText(t("ownerOverview.actionCenter"), "Action Center")}
                items={actionCenterItems}
              />
            )}

            <Card className="border-border bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  {safeText(t("ownerOverview.upcomingBookings"), "Upcoming Bookings")}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="space-y-4">
                    <EmptyState
                      icon={CalendarClock}
                      title={safeText(
                        t("ownerOverview.noUpcomingBookings"),
                        "No upcoming bookings"
                      )}
                      description={safeText(
                        t("ownerOverview.noUpcomingBookingsDesc"),
                        "Confirmed upcoming bookings will appear here once players book your fields."
                      )}
                    />
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/owner/fields">{labels.manageFields}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:bg-emerald-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground">
                              {booking.customerName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.bookingCode}
                            </div>
                          </div>

                          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {booking.amount.toLocaleString()} {booking.currency}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-700" />
                            <span>{booking.fieldName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-700" />
                            <span>{formatShortTimeRange(booking.startTime, booking.endTime)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-emerald-700" />
                            <span>{booking.customerType}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-emerald-700" />
                            <span>{formatDateTimeRange(booking.startTime, booking.endTime)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}