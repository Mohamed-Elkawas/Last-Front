"use client"

import { useMemo } from "react"
import { useNotificationsStore } from "@/lib/notifications-store"
import { useAuth } from "@/hooks/use-auth"
import {
  clearAllNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotification,
} from "@/lib/services/notifications.service"

function visibleForRole(
  audience: string | undefined,
  accountType: "player" | "owner" | null,
): boolean {
  const a = audience ?? "both"
  if (a === "both") return true
  if (!accountType) return true
  if (accountType === "owner") return a === "owner"
  return a === "player"
}

export function useNotifications() {
  const rawItems = useNotificationsStore((s) => s.items)
  const settings = useNotificationsStore((s) => s.settings)
  const hasHydrated = useNotificationsStore((s) => s.hasHydrated)
  const setSetting = useNotificationsStore((s) => s.setSetting)
  const { accountType } = useAuth()

  const items = useMemo(
    () => rawItems.filter((n) => visibleForRole(n.audience, accountType)),
    [rawItems, accountType],
  )

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items])

  return {
    items,
    settings,
    hasHydrated,
    unreadCount,
    setSetting,
    markAsRead: markNotificationRead,
    markAllAsRead: markAllNotificationsRead,
    removeNotification,
    clearAllNotifications,
  }
}

