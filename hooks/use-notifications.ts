"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useNotificationsStore } from "@/lib/notifications-store"
import {
  markAllNotificationsRead,
  markNotificationRead,
  refreshNotifications,
} from "@/lib/notifications"

export function useNotifications() {
  const notifications = useNotificationsStore((state) => state.notifications)
  const isLoading = useNotificationsStore((state) => state.isLoading)
  const error = useNotificationsStore((state) => state.error)

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  )

  const refresh = useCallback(() => {
    return refreshNotifications()
  }, [])

 const markAsRead = useCallback((id: string) => {
  return markNotificationRead(id)
}, [])

  const markAllAsRead = useCallback(() => {
    return markAllNotificationsRead()
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  }
}