import type { LocalizedString } from "@/lib/types/common"

export type BookingKind = "playground" | "tournament"

export type BookingLifecycleStatus =
  | "pending_payment"
  | "payment_submitted"
  | "awaiting_admin_approval"
  | "pending_review"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired"
  | "rejected"

/** Alias aligned with typical API naming. */
export type BookingStatus = BookingLifecycleStatus

/** Owner/admin decision on a booking awaiting approval (maps to future PATCH /bookings/:id). */
export type OwnerBookingDecision = "approve" | "reject"

export type OwnerBookingAction = {
  bookingId: string
  decision: OwnerBookingDecision
}

/** Payment sub-state for API mapping (orthogonal to booking lifecycle in real backends). */
export type PaymentStatus =
  | "none"
  | "awaiting_proof"
  | "submitted"
  | "under_review"
  | "captured"
  | "failed"
  | "refunded"

export type PaymentMethod = "vodafone" | "instapay"

export type CreatePlaygroundBookingPayload = {
  playgroundId: string
  playgroundName: LocalizedString
  playgroundLocation: LocalizedString
  date: string
  dateLabel: string
  slots: string
  hours: number
  subtotal: number
  pointsDiscount: number
  total: number
  paymentMethod: PaymentMethod
  /** Player display name for owner dashboards (maps to future `bookedBy` on API). */
  playerDisplayName?: string
  /** Contact phone shown on owner operations screens (frontend-only MVP). */
  playerPhone?: string
}

export type CreateTournamentBookingPayload = {
  tournamentId: string
  tournamentName: LocalizedString
  teamName: string
  players: number
  total: number
  paymentMethod: PaymentMethod
}

export type PaymentProof = {
  payerName: string
  paymentNumber: string
  transactionReference: string
  screenshotName?: string
}

export type PlaygroundBookingSnapshot = {
  id: string
  name: LocalizedString
  location: LocalizedString
  date: string
  dateLabel: string
  slots: string
  hours: number
  subtotal: number
  pointsDiscount: number
  total: number
}

export type TournamentBookingSnapshot = {
  id: string
  name: LocalizedString
  teamName: string
  players: number
  total: number
}

export type Booking = {
  id: string
  kind: BookingKind
  status: BookingLifecycleStatus
  paymentStatus: PaymentStatus
  createdAt: number
  expiresAt: number
  /** Player / booker name for owner views when distinct from payment payer. */
  playerDisplayName?: string
  playerPhone?: string
  /** Owner marks the reserved match as completed (playground bookings). */
  playedAt?: number
  rated?: boolean
  paymentSubmittedAt?: number
  approvedAt?: number
  rejectedAt?: number
  cancelledAt?: number
  paymentMethod?: PaymentMethod
  payment?: PaymentProof
  playground?: PlaygroundBookingSnapshot
  tournament?: TournamentBookingSnapshot
}

/** Persisted client-side until bookings API exists (`paymentStatus` is derived). */
export type PersistedBooking = Omit<Booking, "paymentStatus">
