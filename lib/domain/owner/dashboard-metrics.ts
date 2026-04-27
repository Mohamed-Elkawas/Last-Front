import type { Booking } from "@/lib/types/booking"

export type OwnerDashboardMetrics = {
  bookingsToday: number
  bookingsWeek: number
  bookingsMonth: number
  confirmed: number
  cancelled: number
  pendingApprovals: number
  revenueToday: number
  revenueWeek: number
  revenueMonth: number
  slotCounts: Record<string, number>
  tournamentRegistrationsMonth: number
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function startOfWeekMonday(ts: number): number {
  const d = new Date(startOfDay(ts))
  const day = d.getDay()
  const diff = (day + 6) % 7
  d.setDate(d.getDate() - diff)
  return d.getTime()
}

function startOfMonth(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

function bookingRevenue(booking: Booking): number {
  if (booking.kind === "playground" && booking.playground) return booking.playground.total
  if (booking.kind === "tournament" && booking.tournament) return booking.tournament.total
  return 0
}

function isConfirmedRevenue(booking: Booking): boolean {
  return booking.status === "confirmed" || booking.status === "cancelled"
}

/** Playground bookings in scope (pre-filtered ids). */
export function computeOwnerDashboardMetrics(
  playgroundBookings: Booking[],
  allTournamentBookings: Booking[],
  now = Date.now(),
): OwnerDashboardMetrics {
  const day0 = startOfDay(now)
  const week0 = startOfWeekMonday(now)
  const month0 = startOfMonth(now)

  const inRange = (b: Booking, from: number) => b.createdAt >= from

  const bookingsToday = playgroundBookings.filter((b) => inRange(b, day0)).length
  const bookingsWeek = playgroundBookings.filter((b) => inRange(b, week0)).length
  const bookingsMonth = playgroundBookings.filter((b) => inRange(b, month0)).length

  const confirmed = playgroundBookings.filter((b) => b.status === "confirmed").length
  const cancelled = playgroundBookings.filter((b) => b.status === "cancelled").length
  const pendingApprovals = playgroundBookings.filter((b) => b.status === "awaiting_admin_approval").length

  const revenueToday = playgroundBookings
    .filter((b) => inRange(b, day0) && isConfirmedRevenue(b))
    .reduce((sum, b) => sum + bookingRevenue(b), 0)
  const revenueWeek = playgroundBookings
    .filter((b) => inRange(b, week0) && isConfirmedRevenue(b))
    .reduce((sum, b) => sum + bookingRevenue(b), 0)
  const revenueMonth = playgroundBookings
    .filter((b) => inRange(b, month0) && isConfirmedRevenue(b))
    .reduce((sum, b) => sum + bookingRevenue(b), 0)

  const slotCounts: Record<string, number> = {}
  for (const b of playgroundBookings) {
    if (b.kind !== "playground" || !b.playground) continue
    if (!["confirmed", "awaiting_admin_approval", "payment_submitted", "pending_payment"].includes(b.status)) {
      continue
    }
    const key = `${b.playground.dateLabel} · ${b.playground.slots}`
    slotCounts[key] = (slotCounts[key] ?? 0) + 1
  }

  const tournamentRegistrationsMonth = allTournamentBookings.filter(
    (b) => b.kind === "tournament" && inRange(b, month0) && b.status !== "rejected" && b.status !== "expired",
  ).length

  return {
    bookingsToday,
    bookingsWeek,
    bookingsMonth,
    confirmed,
    cancelled,
    pendingApprovals,
    revenueToday,
    revenueWeek,
    revenueMonth,
    slotCounts,
    tournamentRegistrationsMonth,
  }
}

export function topBookedSlots(slotCounts: Record<string, number>, limit = 5): { label: string; count: number }[] {
  return Object.entries(slotCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
