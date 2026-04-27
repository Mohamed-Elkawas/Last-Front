import type { Booking } from "@/lib/types/booking"

export function isCancelableBooking(booking: Booking): boolean {
  return !["cancelled", "expired", "rejected"].includes(booking.status)
}

export function isUpcomingBooking(booking: Booking): boolean {
  if (booking.status === "confirmed" && booking.playedAt) return false
  return (
    booking.status === "pending_payment" ||
    booking.status === "payment_submitted" ||
    booking.status === "awaiting_admin_approval" ||
    booking.status === "confirmed"
  )
}

export function isPastBooking(booking: Booking): boolean {
  if (booking.status === "confirmed" && booking.playedAt) return true
  return booking.status === "expired" || booking.status === "rejected"
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

