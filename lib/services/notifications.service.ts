import { http } from "@/lib/API/http-client"
import type { EntityId } from "@/lib/types/common"
import type { AppNotification } from "@/lib/types/notification"

type ApiResponse<T> = {
  isSuccess: boolean
  data: T
  message?: string | null
  errors?: unknown
}

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export const notificationsService = {
  async getAll(): Promise<AppNotification[]> {
    if (!getToken()) return []

    try {
      const res = await http<ApiResponse<AppNotification[]>>("/api/notifications")
      return res.data ?? []
    } catch (error) {
      if (error instanceof Error && /(404|not found)/i.test(error.message)) {
        return []
      }

      console.warn("Failed to load remote notifications", error)
      return []
    }
  },

  async getCount(): Promise<number> {
    if (!getToken()) return 0

    try {
      const res = await http<ApiResponse<{ unreadCount: number }>>("/api/notifications/count")
      return res.data?.unreadCount ?? 0
    } catch (error) {
      if (error instanceof Error && /(404|not found)/i.test(error.message)) {
        return 0
      }

      console.warn("Failed to load remote notification count", error)
      return 0
    }
  },

  async markAsRead(id: EntityId): Promise<void> {
    if (!getToken()) return

    try {
      await http(`/notifications/${id}/read`, {
        method: "PATCH",
      })
    } catch (error) {
      console.warn("Failed to mark notification as read remotely", error)
    }
  },

  async markAllAsRead(): Promise<void> {
    if (!getToken()) return

    try {
      await http("/notifications/read-all", {
        method: "PATCH",
      })
    } catch (error) {
      console.warn("Failed to mark all notifications as read remotely", error)
    }
  },
}