import type { PersistedBooking } from "@/lib/types/booking"

/**
 * Product vocabulary for dashboards / specs (maps from persisted lifecycle model).
 */
export type DomainBookingPhase =
  | "pending_request"
  | "approved"
  | "rejected"
  | "confirmed"
  | "played"
  | "cancelled"
  | "expired"

export function toDomainBookingPhase(booking: PersistedBooking): DomainBookingPhase {
  const s = booking.status
  if (s === "confirmed") {
    return booking.playedAt ? "played" : "confirmed"
  }
  if (s === "awaiting_admin_approval") return "approved"
  if (s === "pending_payment" || s === "payment_submitted") return "pending_request"
  if (s === "rejected") return "rejected"
  if (s === "cancelled") return "cancelled"
  if (s === "expired") return "expired"
  return "pending_request"
}
