import type { PersistedBooking } from "@/lib/types/booking"

/** Playground rows that should appear on the owner “requests” screen (pipeline). */
export function selectPlaygroundBookingRequests(bookings: PersistedBooking[]): PersistedBooking[] {
  return bookings.filter(
    (b) =>
      b.kind === "playground" &&
      b.playground &&
      (b.status === "pending_payment" ||
        b.status === "payment_submitted" ||
        b.status === "awaiting_admin_approval"),
  )
}

export function selectPlaygroundConfirmedBookings(bookings: PersistedBooking[]): PersistedBooking[] {
  return bookings.filter((b) => b.kind === "playground" && b.status === "confirmed")
}
