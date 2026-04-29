import type { Booking } from "@/lib/types/booking"

export function isCancelableBooking(booking: Booking): boolean {
  return !["cancelled", "expired", "rejected", "completed"].includes(booking.status)
}

function isExpiredLocally(booking: Booking): boolean {
  return (
    booking.status === "pending_payment" &&
    Date.now() > booking.expiresAt
  )
}

export function isUpcomingBooking(booking: Booking): boolean {
  // لو confirmed واتلعب خلاص → مش upcoming
  if (booking.status === "confirmed" && booking.playedAt) return false

  // لو expired بالوقت حتى لو sweep لسه مجريتش
  if (isExpiredLocally(booking)) return false

  return (
    booking.status === "pending_payment" ||
    booking.status === "payment_submitted" ||
    booking.status === "awaiting_admin_approval" ||
    booking.status === "confirmed"
  )
}

export function isPastBooking(booking: Booking): boolean {
  // اتلعب
  if (booking.status === "completed") return true

  // confirmed واتلعب
  if (booking.status === "confirmed" && booking.playedAt) return true

  // expired بالـ status أو بالوقت
  if (booking.status === "expired") return true
  if (isExpiredLocally(booking)) return true

  // rejected
  if (booking.status === "rejected") return true

  return false
}

export function isCancelledBooking(booking: Booking): boolean {
  return booking.status === "cancelled"
}

export function groupBookingsByTabs(bookings: Booking[]) {
  return {
    upcoming: bookings.filter(isUpcomingBooking),
    past: bookings.filter(isPastBooking),
    cancelled: bookings.filter(isCancelledBooking),
  }
}