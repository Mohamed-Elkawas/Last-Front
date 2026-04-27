import type { EntityId } from "@/lib/types/common"

export type NotificationAudience = "player" | "owner" | "both"

export type NotificationType =
  | "booking_created"
  | "booking_cancelled"
  | "tournament_joined"
  | "tournament_created"
  | "booking_approved"
  | "booking_rejected"
  | "payment_submitted"
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
  createdAt: number
  isRead: boolean
  entityId?: EntityId
  entityType?: NotificationEntityType
  actionHref?: string
  /** Delivery channel for simulated multi-tenant inbox (frontend-only MVP). */
  audience?: NotificationAudience
}

export type NotificationInput = Omit<AppNotification, "id" | "createdAt" | "isRead">

export type NotificationSettingKey = "booking" | "tournament" | "owner" | "system"
