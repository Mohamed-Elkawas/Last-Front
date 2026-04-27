"use client"

import { useMemo, useState } from "react"
import { BellRing, CalendarClock, CalendarDays, CircleAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { ActionCenterList } from "@/features/backoffice/shared/components/action-center-list"
import { DataTableShell } from "@/features/backoffice/shared/components/data-table-shell"
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

function isUpcomingVisibleStatus(status?: string) {
  return status === "confirmed"
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

function isRevenueStatus(status?: string) {
  return status === "confirmed"
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
>(periodBookings: T[], period: Period, locale: string) {
  const grouped = new Map<string, ChartPoint>()

  periodBookings.forEach((booking) => {
    if (!isRevenueStatus(booking.bookingStatus)) return

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
      ? "لا توجد حجوزات لهذه الفترة"
      : "No booking activity for this period.",
    insight: isArabic ? "تحليل" : "Insight",
    busiestSlot: isArabic ? "أكثر وقت ازدحامًا" : "Busiest slot",
    from: isArabic ? "من" : "of",
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
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 text-sm text-muted-foreground">
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
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 text-sm text-muted-foreground">
        {labels.noPeakData}
      </div>
    )
  }

  const maxCount = Math.max(...points.map((point) => point.count), 1)
  const busiest = points.reduce((best, point) => (point.count > best.count ? point : best), points[0])

  return (
    <div className="flex h-64 flex-col justify-end gap-4 rounded-2xl bg-emerald-50/50 p-4">
      <div className="flex flex-1 items-end justify-center gap-3">
        {points.map((point) => {
          const height = Math.max(18, (point.count / maxCount) * 150)
          const isBusiest = point.hour === busiest.hour

          return (
            <div key={point.hour} className="flex flex-col items-center gap-2">
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

export default function OwnerOverviewPage() {
  const overview = useOwnerOverview()
  const bookings = useOwnerBookings()
  const { t, language } = useAppTranslations()

  const [period, setPeriod] = useState<Period>("daily")

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

  const { kpis, revenueTrendPoints, peakHourPoints } = useMemo(() => {
    const { start, end } = getPeriodRange(period)

    const filteredBookings = bookings.data.filter((booking) => {
      const bookingDate = new Date(booking.startTime)
      return bookingDate >= start && bookingDate < end
    })

    const revenueBookings = filteredBookings.filter((booking) =>
      isRevenueStatus(booking.bookingStatus)
    )

    const totalRevenue = revenueBookings.reduce(
      (sum, booking) => sum + (Number(booking.amount) || 0),
      0
    )
    const totalBookings = filteredBookings.length
    const occupancy =
      totalBookings > 0 ? (revenueBookings.length / totalBookings) * 100 : 0

    const previousBookings = bookings.data.filter(
      (booking) => new Date(booking.startTime) < start
    )
    const previousPlayers = new Set(previousBookings.map(getPlayerKey))
    const periodPlayers = new Set(filteredBookings.map(getPlayerKey))

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
      revenueTrendPoints: buildRevenueTrendPoints(filteredBookings, period, locale),
      peakHourPoints: buildPeakHourPoints(filteredBookings),
      kpis: {
        totalRevenue,
        occupancy: Math.min(Math.max(occupancy, 0), 100),
        newPlayers,
        returningPlayers,
        returningPercentage,
        totalUniquePlayers,
      },
    }
  }, [bookings.data, locale, period])

  const upcomingBookings = useMemo(() => {
    const now = Date.now()

    return bookings.data
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
  }, [bookings.data])

  const actionCenterItems = useMemo(() => {
    const items = []

    const pendingPaymentReviews = bookings.data.filter(
  (booking) =>
    booking.paymentStatus === "not_required" ||
    booking.bookingStatus === "pending_payment_review"
)

    const noShowCandidates = bookings.data.filter(
      (booking) => booking.checkInStatus === "no_show_candidate"
    )

    const upcomingConfirmed = bookings.data.filter(
      (booking) =>
        booking.bookingStatus === "confirmed" &&
        new Date(booking.startTime).getTime() > Date.now()
    )

    if (pendingPaymentReviews.length > 0) {
      items.push({
        id: "owner-alert-payments",
        type: "slow_review" as const,
        title: t("ownerOverview.alertPaymentsTitle") || "Payment reviews pending",
        description: `${pendingPaymentReviews.length} booking(s) need payment review.`,
        severity: "high" as const,
        status: "open" as const,
        relatedEntityLabel: "Requests",
        createdAt: new Date().toISOString(),
      })
    }

    if (noShowCandidates.length > 0) {
      items.push({
        id: "owner-alert-no-show",
        type: "anomaly" as const,
        title: t("ownerOverview.alertNoShowTitle") || "No-show candidates",
        description: `${noShowCandidates.length} booking(s) passed without check-in.`,
        severity: "medium" as const,
        status: "open" as const,
        relatedEntityLabel: "Operations",
        createdAt: new Date().toISOString(),
      })
    }

    if (upcomingConfirmed.length > 0) {
      items.push({
        id: "owner-alert-upcoming",
        type: "anomaly" as const,
        title: "Upcoming confirmed bookings",
        description: `${upcomingConfirmed.length} confirmed booking(s) coming up.`,
        severity: "low" as const,
        status: "acknowledged" as const,
        relatedEntityLabel: "Upcoming bookings",
        createdAt: new Date().toISOString(),
      })
    }

    return items
  }, [bookings.data, t])

  const columns = [
    {
      key: "bookingCode",
      header: t("ownerOverview.booking"),
      render: (booking: (typeof upcomingBookings)[number]) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{booking.bookingCode}</div>
          <div className="text-xs text-muted-foreground">{booking.fieldName}</div>
        </div>
      ),
    },
    {
      key: "customer",
      header: t("ownerOverview.playerTeam"),
      render: (booking: (typeof upcomingBookings)[number]) => (
        <div className="space-y-1">
          <div className="text-sm text-foreground">{booking.customerName}</div>
          <div className="text-xs text-muted-foreground">{booking.customerType}</div>
        </div>
      ),
    },
    {
      key: "time",
      header: t("ownerOverview.schedule"),
      render: (booking: (typeof upcomingBookings)[number]) => (
        <div className="text-sm text-muted-foreground">
          {formatDateTimeRange(booking.startTime, booking.endTime)}
        </div>
      ),
    },
    {
      key: "amount",
      header: t("ownerOverview.amount"),
      render: (booking: (typeof upcomingBookings)[number]) => (
        <div className="text-sm font-medium text-foreground">
          {booking.amount.toLocaleString()} {booking.currency}
        </div>
      ),
    },
  ]

  const isLoading = overview.isLoading || bookings.isLoading
  const error = overview.error || bookings.error

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={t("ownerOverview.title")}
        description={t("ownerOverview.description")}
      />

      {isLoading ? (
        <LoadingState rows={6} />
      ) : error ? ( 
        <EmptyState
          icon={CircleAlert}
          title={t("ownerOverview.unableToLoad")}
description={String(error)}        />
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
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {formatCurrency(kpis.totalRevenue)} EGP
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {labels.totalRevenue}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {kpis.occupancy.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {labels.bookingOccupancy}
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-emerald-600"
                        style={{ width: `${kpis.occupancy}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{kpis.newPlayers}</div>
                    <div className="text-sm text-muted-foreground">
                      {labels.newPlayers}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {kpis.returningPercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {labels.returningPlayers}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {kpis.returningPlayers} {labels.from} {kpis.totalUniquePlayers}
                    </div>
                  </CardContent>
                </Card>
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
              <EmptyState
                icon={BellRing}
                title={t("ownerOverview.noActionItems")}
                description={t("ownerOverview.noActionItemsDesc")}
              />
            ) : (
              <ActionCenterList
                title={t("ownerOverview.actionCenter")}
                items={actionCenterItems}
              />
            )}

            <Card className="border-border bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  {t("ownerOverview.upcomingBookings")}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <EmptyState
                    icon={CalendarClock}
                    title={t("ownerOverview.noUpcomingBookings")}
                    description={t("ownerOverview.noUpcomingBookingsDesc")}
                  />
                ) : (
                  <DataTableShell
                    columns={columns}
                    rows={upcomingBookings}
                    getRowId={(booking) => booking.id}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}