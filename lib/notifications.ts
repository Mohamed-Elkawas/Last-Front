import { notificationsService } from "@/lib/services/notifications.service"
import { useNotificationsStore } from "@/lib/notifications-store"
import type { EntityId } from "@/lib/types/common"
import type { NotificationInput } from "@/lib/types/notification"

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Failed to load notifications"
}

export async function refreshNotifications() {
  const store = useNotificationsStore.getState()

  try {
    store.setLoading(true)
    store.setError(null)

    const remoteNotifications = await notificationsService.getAll()

    if (remoteNotifications.length > 0) {
      store.setNotifications(remoteNotifications)
    }

    return useNotificationsStore.getState().notifications
  } catch (error) {
    store.setError(getErrorMessage(error))
    return useNotificationsStore.getState().notifications
  } finally {
    store.setLoading(false)
  }
}

export async function markNotificationRead(id: EntityId) {
  useNotificationsStore.getState().markAsReadLocal(id)

  try {
    await notificationsService.markAsRead(id)
  } catch {
    // local-first while backend notifications are not connected
  }
}

export async function markAllNotificationsRead() {
  useNotificationsStore.getState().markAllAsReadLocal()

  try {
    await notificationsService.markAllAsRead()
  } catch {
    // local-first while backend notifications are not connected
  }
}

export function addLocalNotification(input: NotificationInput) {
  return useNotificationsStore.getState().addNotification(input)
}