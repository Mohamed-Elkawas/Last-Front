"use client"

import { useMemo } from "react"
import { useOwnerBookings as useOwnerBookingDomain } from "@/hooks/use-owner-bookings"
import type { Booking, BookingSlot } from "@/lib/types/booking"
import type {
  BookingRecord,
  BookingStatus,
  CheckInStatus,
  PaymentStatus,
} from "@/features/backoffice/shared/types/entities"

type SlotLike = string | BookingSlot

function toVenueLabel(booking: Booking) {
  if (booking.kind === "playground" && booking.playground) {
    return booking.playground.name.en || booking.playground.name.ar || "Playground"
  }

  return booking.tournament?.name.en || booking.tournament?.name.ar || "Tournament"
}

function toCustomerName(booking: Booking) {
  if (booking.kind === "tournament" && booking.tournament?.teamName) {
    return booking.tournament.teamName
  }

  return (
    booking.playerDisplayName?.trim() ||
    booking.payment?.payerName?.trim() ||
    "Unknown Player"
  )
}

function extractTimes(slots: SlotLike[] | SlotLike | undefined) {
  const slotList = Array.isArray(slots) ? slots : slots ? [slots] : []

  const times = slotList.flatMap((slot) => {
    if (typeof slot === "string") {
      return slot.match(/\b\d{1,2}:\d{2}\b/g) ?? []
    }

    return [slot.startTime, slot.endTime].filter(Boolean)
  })

  return Array.from(new Set(times)).sort()
}

function addHour(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const nextHours = Number.isFinite(hours) ? (hours + 1) % 24 : 0
  const nextMinutes = Number.isFinite(minutes) ? minutes : 0

  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(
    2,
    "0",
  )}`
}

function hasExplicitEnd(slots: SlotLike[] | SlotLike | undefined) {
  const slotList = Array.isArray(slots) ? slots : slots ? [slots] : []

  return slotList.some((slot) => {
    if (typeof slot === "string") return slot.includes("-")
    return Boolean(slot.endTime)
  })
}

function resolvePlaygroundWindow(booking: Booking) {
  if (booking.kind !== "playground" || !booking.playground) {
    return {
      startTime: new Date(booking.createdAt).toISOString(),
      endTime: new Date(booking.expiresAt).toISOString(),
      hasEnded: booking.expiresAt <= Date.now(),
    }
  }

  const slots = booking.playground.slots
  const times = extractTimes(slots)

  const start = times[0] ?? "00:00"
  const last = times[times.length - 1] ?? start
  const end = times.length >= 2 && hasExplicitEnd(slots) ? last : addHour(last)

  const startTime = `${booking.playground.date}T${start}:00`
  const endTime = `${booking.playground.date}T${end}:00`

  return {
    startTime,
    endTime,
    hasEnded: new Date(endTime).getTime() <= Date.now(),
  }
}

function toBookingStatus(booking: Booking): BookingStatus {
  if (booking.status === "confirmed" && booking.playedAt) return "completed"
  if (booking.status === "confirmed") return "confirmed"
  if (booking.status === "expired") return "expired_hold"
  if (booking.status === "cancelled" || booking.status === "rejected") {
    return "cancelled"
  }

  return "pending_payment_review"
}

function toPaymentStatus(status: Booking["paymentStatus"]): PaymentStatus {
  switch (status) {
    case "captured":
      return "approved"
    case "failed":
    case "refunded":
      return "rejected"
    case "none":
      return "not_required"
    default:
      return "pending"
  }
}

function toCheckInStatus(booking: Booking): CheckInStatus {
  const { hasEnded } = resolvePlaygroundWindow(booking)

  if (booking.playedAt) return "checked_in"
  if (booking.status === "confirmed" && hasEnded) return "no_show_candidate"
  return "awaiting"
}

function toRecord(booking: Booking): BookingRecord {
  const window = resolvePlaygroundWindow(booking)
  const amount = booking.playground?.total ?? booking.tournament?.total ?? 0

  return {
    id: booking.id,
    bookingCode: `BK-${booking.id.slice(-4).toUpperCase()}`,
    fieldId: booking.playground?.id ?? booking.tournament?.id ?? booking.id,
    fieldName: toVenueLabel(booking),
    customerName: toCustomerName(booking),
    customerType: booking.kind === "tournament" ? "team" : "player",
    startTime: window.startTime,
    endTime: window.endTime,
    amount,
    currency: "EGP",
    paymentStatus: toPaymentStatus(booking.paymentStatus),
    bookingStatus: toBookingStatus(booking),
    checkInStatus: toCheckInStatus(booking),
    notes: [],
  }
}

export function useOwnerBookings() {
  const { playgroundBookingsForOwner, hasHydrated } = useOwnerBookingDomain()

  const data = useMemo(
    () => playgroundBookingsForOwner.map(toRecord),
    [playgroundBookingsForOwner],
  )

  return {
    data,
    isLoading: !hasHydrated,
    error: null,
  }
}