"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { useNotificationsStore } from "@/lib/notifications-store"
import { notificationsService } from "@/lib/services/notifications.service"
import {
  markAllNotificationsRead,
  markNotificationRead,
  refreshNotifications,
} from "@/lib/notifications"

const ENABLE_NOTIFICATIONS =
  process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === "true"

export function useNotifications() {
  const pathname = usePathname()
  const isNotificationsPage = pathname?.startsWith("/notifications")

  const notifications = useNotificationsStore((state) => state.notifications)
  const isLoading = useNotificationsStore((state) => state.isLoading)
  const error = useNotificationsStore((state) => state.error)

  const [count, setCount] = useState(0)

  const unreadCount = useMemo(() => {
    if (!ENABLE_NOTIFICATIONS) return 0

    if (isNotificationsPage) {
      return notifications.filter((item) => !item.isRead).length
    }

    return count
  }, [count, notifications, isNotificationsPage])

  const refresh = useCallback(async () => {
    if (!ENABLE_NOTIFICATIONS) {
      setCount(0)
      return []
    }

    if (isNotificationsPage) {
      return refreshNotifications()
    }

    try {
      const notificationCount = await notificationsService.getCount()
      setCount(notificationCount)
    } catch {
      setCount(0)
    }

    return notifications
  }, [isNotificationsPage, notifications])

  const markAsRead = useCallback((id: string) => {
    if (!ENABLE_NOTIFICATIONS) return Promise.resolve()
    return markNotificationRead(id)
  }, [])

  const markAllAsRead = useCallback(() => {
    if (!ENABLE_NOTIFICATIONS) return Promise.resolve()
    return markAllNotificationsRead()
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    notifications: ENABLE_NOTIFICATIONS ? notifications : [],
    unreadCount,
    isLoading: ENABLE_NOTIFICATIONS ? isLoading : false,
    error: ENABLE_NOTIFICATIONS ? error : null,
    refresh,
    markAsRead,
    markAllAsRead,
  }
}