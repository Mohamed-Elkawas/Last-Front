import type { EntityId } from "@/lib/types/common"

export type NotificationAudience = "player" | "owner" | "both"

export type NotificationType =
  | "booking_created"
  | "booking_cancelled"
  | "payment_required"
  | "payment_submitted"
  | "owner_approval_pending"
  | "booking_approved"
  | "booking_rejected"
  | "tournament_joined"
  | "tournament_created"
  | "owner_booking_request"
  | "owner_booking_payment"
  | "owner_tournament_registration"
  | "system"

export type NotificationEntityType =
  | "booking"
  | "playground"
  | "tournament"
  | "owner"
  | "system"

export type AppNotification = {
  id: EntityId
  type: NotificationType
  title: string
  message: string
  createdAt: string
  isRead: boolean
  entityId?: EntityId
  entityType?: NotificationEntityType
  actionHref?: string
  audience?: NotificationAudience
  metadata?: {
    bookingId?: EntityId
    tournamentId?: EntityId
    playgroundId?: EntityId
    paymentDeadline?: string
  }
}

export type NotificationSettingKey = "booking" | "tournament" | "owner" | "system"

export type NotificationInput = Omit<
  AppNotification,
  "id" | "createdAt" | "isRead"
> & {
  audience?: NotificationAudience
}