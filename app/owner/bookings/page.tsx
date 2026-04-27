"use client"

import { useMemo, useState } from "react"
import { Calendar, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTableShell } from "@/features/backoffice/shared/components/data-table-shell"
import { EmptyState } from "@/features/backoffice/shared/components/empty-state"
import { LoadingState } from "@/features/backoffice/shared/components/loading-state"
import { StatusBadge } from "@/features/backoffice/shared/components/status-badge"
import { useOwnerBookings } from "@/features/backoffice/owner/hooks/use-owner-bookings"

const filters = [
  { label: "Today", value: "today" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Pending", value: "pending_payment_review" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Canceled", value: "cancelled" },
] as const

type FilterValue = (typeof filters)[number]["value"]

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-white md:text-3xl">{title}</h1>
      <p className="max-w-3xl text-sm text-slate-400">{description}</p>
    </div>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)

  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`
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

function getStatusLabel(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function renderStatus(value: string) {
  return <StatusBadge label={getStatusLabel(value)} tone={getStatusTone(value)} />
}

export default function OwnerBookingsPage() {
  const { data, isLoading, error } = useOwnerBookings()
  const [activeFilter, setActiveFilter] = useState<FilterValue>("today")

  const filteredBookings = useMemo(() => {
    const now = new Date()
    const todayKey = now.toDateString()

    return data.filter((booking) => {
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
  }, [activeFilter, data])

  const columns = [
    {
      key: "bookingCode",
      header: "Booking Code",
      render: (booking: (typeof data)[number]) => (
        <span className="font-medium text-white">{booking.bookingCode}</span>
      ),
    },
    {
      key: "fieldName",
      header: "Field Name",
      render: (booking: (typeof data)[number]) => (
        <span className="text-sm text-slate-100">{booking.fieldName}</span>
      ),
    },
    {
      key: "customer",
      header: "Player / Team",
      render: (booking: (typeof data)[number]) => (
        <div className="space-y-1">
          <div className="text-sm text-slate-100">{booking.customerName}</div>
          <div className="text-xs text-slate-400">{getStatusLabel(booking.customerType)}</div>
        </div>
      ),
    },
    {
      key: "startTime",
      header: "Start Time",
      render: (booking: (typeof data)[number]) => (
        <span className="text-sm text-slate-300">{formatDateTime(booking.startTime)}</span>
      ),
    },
    {
      key: "endTime",
      header: "End Time",
      render: (booking: (typeof data)[number]) => (
        <span className="text-sm text-slate-300">{formatDateTime(booking.endTime)}</span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      render: (booking: (typeof data)[number]) => renderStatus(booking.paymentStatus),
    },
    {
      key: "amount",
      header: "Amount",
      render: (booking: (typeof data)[number]) => (
        <span className="text-sm font-medium text-white">
          {booking.amount.toLocaleString()} {booking.currency}
        </span>
      ),
    },
    {
      key: "checkInStatus",
      header: "Check-in Status",
      render: (booking: (typeof data)[number]) => renderStatus(booking.checkInStatus),
    },
    {
      key: "bookingStatus",
      header: "Booking Status",
      render: (booking: (typeof data)[number]) => renderStatus(booking.bookingStatus),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline">
            View Details
          </Button>
          <Button type="button" size="sm" variant="outline">
            Mark Attendance
          </Button>
          <Button type="button" size="sm" variant="outline">
            Review Payment
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Owner Bookings"
        description="Track daily booking flow, monitor payment progress, and review attendance-related statuses from one operational table."
      />

      <Card className="border-slate-800 bg-slate-900/45 text-slate-100">
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg text-white">Filters</CardTitle>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={activeFilter === filter.value ? "default" : "outline"}
                className={
                  activeFilter === filter.value
                    ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    : "border-slate-700 bg-slate-950/40 text-slate-200 hover:bg-slate-800"
                }
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState rows={6} />
          ) : error ? (
            <EmptyState icon={CircleAlert} title="Unable to load bookings" description={error} />
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No bookings found"
              description="There are no bookings matching the selected filter."
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
    </div>
  )
}
