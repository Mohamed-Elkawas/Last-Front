import { useNotificationsStore } from "@/lib/notifications-store"
import type { EntityId } from "@/lib/types/common"
import type { NotificationInput, NotificationSettingKey, NotificationType } from "@/lib/types/notification"

function mapTypeToSetting(
  type: NotificationType,
): NotificationSettingKey {
  const mapping: Record<NotificationType, NotificationSettingKey> = {
    booking_created: "booking",
    booking_cancelled: "booking",
    payment_submitted: "booking",
    tournament_joined: "tournament",
    tournament_created: "tournament",
    booking_approved: "owner",
    booking_rejected: "owner",
    owner_booking_request: "owner",
    owner_booking_payment: "owner",
    owner_tournament_registration: "owner",
    system: "system",
  }
  return mapping[type]
}

export function pushNotification(input: NotificationInput) {
  const store = useNotificationsStore.getState()
  const settingKey = mapTypeToSetting(input.type)

  if (!store.settings[settingKey]) return null

  return store.addNotification(input)
}

export function markNotificationRead(id: EntityId) {
  useNotificationsStore.getState().markAsRead(id)
}

export function markAllNotificationsRead() {
  useNotificationsStore.getState().markAllAsRead()
}

export function removeNotification(id: EntityId) {
  useNotificationsStore.getState().removeNotification(id)
}

export function clearAllNotifications() {
  useNotificationsStore.getState().clearAllNotifications()
}