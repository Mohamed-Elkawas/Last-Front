import type { BookingLifecycleStatus, PaymentStatus } from "@/lib/types/booking"

/** Maps lifecycle + local demo rules to a payment-focused status for APIs. */
export function derivePaymentStatus(status: BookingLifecycleStatus): PaymentStatus {
  switch (status) {
    case "pending_payment":
      return "awaiting_proof"
    case "payment_submitted":
      return "submitted"
    case "awaiting_admin_approval":
      return "under_review"
    case "confirmed":
      return "captured"
    case "rejected":
    case "expired":
      return "failed"
    case "cancelled":
      return "refunded"
    default:
      return "none"
  }
}

