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

export type BookingStatus = BookingLifecycleStatus

export type OwnerBookingDecision = "approve" | "reject"

export type OwnerBookingAction = {
  bookingId: string
  decision: OwnerBookingDecision
}

export type PaymentStatus =
  | "none"
  | "awaiting_proof"
  | "submitted"
  | "under_review"
  | "captured"
  | "failed"
  | "refunded"

export type PaymentMethod = "vodafone" | "instapay"

export type BookingSlot = {
  startTime: string
  endTime: string
  slotKey: string
}

export type CreateBookingSlotInput = {
  startTime: string
  endTime: string
}

export type CreatePlaygroundBookingPayload = {
  playgroundId: string
  ownerId?: string
  playgroundName: LocalizedString
  playgroundLocation: LocalizedString
  date: string
  dateLabel: string
  slots: BookingSlot[]
  hours: number
  subtotal: number
  pointsDiscount: number
  total: number
  paymentMethod: PaymentMethod
  playerDisplayName: string
  playerPhone: string
  playerEmail?: string
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
  ownerId?: string
  name: LocalizedString
  location: LocalizedString
  date: string
  dateLabel: string
  slots: BookingSlot[]
  slotKeys: string[]
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
  playerDisplayName?: string
  playerPhone?: string
  playerEmail?: string
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

export type PersistedBooking = Omit<Booking, "paymentStatus">