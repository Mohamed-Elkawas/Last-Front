"use client"

import type { PersistedBooking } from "@/lib/types/booking"

export type OwnerDashboardStats = {
  bookingsToday: number
  confirmedToday: number
  pendingPaymentReviews: number
  revenueToday: number
  utilizationRate: number
  noShowCandidates: number
  tournamentsInProgress: number
}

export type UpcomingBooking = {
  id: string
  bookingCode: string
  fieldName: string
  customerName: string
  customerType: string
  startTime: string
  endTime: string
  amount: number
  currency: string
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

function isTodayBooking(booking: PersistedBooking): boolean {
  if (booking.kind === "playground" && booking.playground) {
    return booking.playground.date === getTodayDate()
  }

  if (booking.kind === "tournament") {
    const createdDate = new Date(booking.createdAt).toISOString().split("T")[0]
    return createdDate === getTodayDate()
  }

  return false
}

function isConfirmedBooking(booking: PersistedBooking): boolean {
  return booking.status === "confirmed"
}

function isPendingOwnerReview(booking: PersistedBooking): boolean {
  return booking.status === "awaiting_admin_approval"
}

function getBookingAmount(booking: PersistedBooking): number {
  if (booking.kind === "playground" && booking.playground) {
    return booking.playground.total
  }

  if (booking.kind === "tournament" && booking.tournament) {
    return booking.tournament.total
  }

  return 0
}

function isUpcomingBooking(booking: PersistedBooking): boolean {
  const now = new Date()

  if (booking.kind === "playground" && booking.playground) {
    const firstSlot = booking.playground.slots?.[0]
    const start = firstSlot?.startTime ?? "00:00"
    const bookingStart = new Date(`${booking.playground.date}T${start}:00`)

    return bookingStart > now
  }

  return booking.expiresAt > now.getTime()
}

function getPlaygroundStartIso(booking: PersistedBooking): string {
  if (booking.kind !== "playground" || !booking.playground) {
    return new Date(booking.createdAt).toISOString()
  }

  const firstSlot = booking.playground.slots?.[0]

  if (!firstSlot?.startTime) {
    return new Date(booking.createdAt).toISOString()
  }

  return `${booking.playground.date}T${firstSlot.startTime}:00Z`
}

function getPlaygroundEndIso(booking: PersistedBooking): string {
  if (booking.kind !== "playground" || !booking.playground) {
    return new Date(booking.expiresAt).toISOString()
  }

  const lastSlot = booking.playground.slots?.[booking.playground.slots.length - 1]

  if (!lastSlot?.endTime) {
    return new Date(booking.expiresAt).toISOString()
  }

  return `${booking.playground.date}T${lastSlot.endTime}:00Z`
}

function isNoShowCandidate(booking: PersistedBooking): boolean {
  if (booking.status !== "confirmed") return false

  if (booking.kind === "playground" && booking.playground) {
    const lastSlot = booking.playground.slots?.[booking.playground.slots.length - 1]
    const end = lastSlot?.endTime ?? "00:00"
    const endTime = new Date(`${booking.playground.date}T${end}:00`)

    return endTime < new Date()
  }

  return false
}

function isTournamentInProgress(booking: PersistedBooking): boolean {
  return booking.kind === "tournament" && booking.status === "confirmed"
}

export function getOwnerDashboardStats(
  bookings: PersistedBooking[],
): OwnerDashboardStats {
  const todayBookings = bookings.filter(isTodayBooking)
  const confirmedToday = todayBookings.filter(isConfirmedBooking)
  const pendingReviews = bookings.filter(isPendingOwnerReview)
  const revenueToday = confirmedToday.reduce(
    (sum, booking) => sum + getBookingAmount(booking),
    0,
  )

  const totalSlots = 20
  const bookedSlotsToday = todayBookings.length
  const utilizationRate =
    totalSlots > 0
      ? Math.round((bookedSlotsToday / totalSlots) * 100 * 10) / 10
      : 0

  const noShowCandidates = bookings.filter(isNoShowCandidate).length
  const tournamentsInProgress = bookings.filter(isTournamentInProgress).length

  return {
    bookingsToday: todayBookings.length,
    confirmedToday: confirmedToday.length,
    pendingPaymentReviews: pendingReviews.length,
    revenueToday,
    utilizationRate,
    noShowCandidates,
    tournamentsInProgress,
  }
}

export function getUpcomingOwnerBookings(
  bookings: PersistedBooking[],
): UpcomingBooking[] {
  return bookings
    .filter(
      (booking) =>
        isUpcomingBooking(booking) &&
        [
          "pending_payment",
          "payment_submitted",
          "awaiting_admin_approval",
          "confirmed",
        ].includes(booking.status),
    )
    .sort((a, b) => {
      if (
        a.kind === "playground" &&
        b.kind === "playground" &&
        a.playground &&
        b.playground
      ) {
        return (
          new Date(a.playground.date).getTime() -
          new Date(b.playground.date).getTime()
        )
      }

      return a.createdAt - b.createdAt
    })
    .slice(0, 5)
    .map((booking) => ({
      id: booking.id,
      bookingCode: `BK-${booking.id.slice(-4).toUpperCase()}`,
      fieldName:
        booking.kind === "playground" && booking.playground
          ? booking.playground.name.en
          : "Tournament",
      customerName: booking.playerDisplayName || "Unknown Player",
      customerType: booking.kind === "playground" ? "player" : "team",
      startTime: getPlaygroundStartIso(booking),
      endTime: getPlaygroundEndIso(booking),
      amount: getBookingAmount(booking),
      currency: "EGP",
    }))
}