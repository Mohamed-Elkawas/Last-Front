import type { SeverityLevel, TimelineItem } from "@/features/backoffice/shared/types/common"

export type BookingStatus =
  | "pending_payment_review"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show_candidate"
  | "expired_hold"

export type PaymentStatus = "pending" | "approved" | "rejected" | "escalated" | "not_required"

export type PaymentMethod = "vodafone_cash" | "instapay" | "cash"

export type CheckInStatus = "awaiting" | "checked_in" | "late" | "no_show_candidate"

export type FieldStatus = "active" | "maintenance" | "inactive" | "blackout"

export type UserStatus = "active" | "suspended" | "inactive"

export type OwnerVerificationStatus = "pending" | "verified" | "rejected" | "suspended"

export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected" | "escalated"

export type AlertStatus = "open" | "acknowledged" | "resolved"

export type AlertType =
  | "anomaly"
  | "abuse"
  | "slow_review"
  | "fraud_candidate"
  | "refund_cluster"

export type EntityId = string

export type AnalyticsMetric = {
  key:
    | "utilization_rate"
    | "booking_confirmation_rate"
    | "refund_rate"
    | "cancellation_rate"
    | "no_show_rate"
    | "payment_approval_rate"
    | "average_booking_value"
    | "platform_commission_revenue"
  label: string
  formula: string
  value: number
  unit: "percentage" | "currency" | "number"
}

export type BookingRecord = {
  id: EntityId
  bookingCode: string
  fieldId: EntityId
  fieldName: string
  customerName: string
  customerType: "player" | "team"
  startTime: string
  endTime: string
  amount: number
  currency: "EGP"
  paymentStatus: PaymentStatus
  bookingStatus: BookingStatus
  checkInStatus: CheckInStatus
  notes: string[]
}

export type PaymentRecord = {
  id: EntityId
  bookingId: EntityId
  bookingCode: string
  proofImageUrl: string
  expectedAmount: number
  paidAmount: number
  currency: "EGP"
  method: PaymentMethod
  senderHandleOrNumber: string
  submittedAt: string
  status: PaymentStatus
  isOverdue: boolean
  internalNote: string | null
}

export type FieldRecord = {
  id: EntityId
  name: string
  status: FieldStatus
  basePrice: number
  currency: "EGP"
  workingHours: string
  nextBookingAt: string | null
  utilizationToday: number
  blackoutStatus: "none" | "partial" | "full_day"
}

export type UserRecord = {
  id: EntityId
  fullName: string
  username: string
  status: UserStatus
  bookingsCount: number
  paymentTotal: number
  suspiciousFlags: number
  badgesSnapshot: string[]
  rankingSnapshot: string
  activitySummary: string
}

export type OwnerRecord = {
  id: EntityId
  name: string
  verificationStatus: OwnerVerificationStatus
  fieldsCount: number
  reviewLatencyHours: number
  refundRate: number
  disputeCount: number
  suspiciousScore: number
}

export type DisputeRecord = {
  id: EntityId
  bookingCode: string
  complainantName: string
  againstPartyName: string
  status: DisputeStatus
  category: string
  severity: SeverityLevel
  summary: string
  timeline: TimelineItem[]
}

export type AlertRecord = {
  id: EntityId
  type: AlertType
  title: string
  description: string
  severity: SeverityLevel
  status: AlertStatus
  relatedEntityLabel: string
  createdAt: string
}

export type AuditLogRecord = {
  id: EntityId
  actorName: string
  actionLabel: string
  entityType: string
  entityId: string
  createdAt: string
  oldValuePreview: string
  newValuePreview: string
}

export type OwnerOverviewRecord = {
  bookingsToday: number
  confirmedToday: number
  pendingPaymentReviews: number
  revenueToday: number
  revenueThisMonth: number
  utilizationRate: number
  noShowCandidates: number
  tournamentsInProgress: number
  actionAlerts: number
  upcomingBookingsSummary: number
}
