"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { EntityId } from "@/lib/types/common"
import type {
  AppNotification,
  NotificationInput,
  NotificationSettingKey,
} from "@/lib/types/notification"

type NotificationSettings = Record<NotificationSettingKey, boolean>

type NotificationsStore = {
  notifications: AppNotification[]
  isLoading: boolean
  error: string | null
  settings: NotificationSettings
  hasHydrated: boolean

  addNotification: (input: NotificationInput) => EntityId
  setNotifications: (notifications: AppNotification[]) => void
  setLoading: (value: boolean) => void
  setError: (error: string | null) => void
  setHasHydrated: (value: boolean) => void

  markAsReadLocal: (id: EntityId) => void
  markAllAsReadLocal: () => void
  setSetting: (key: NotificationSettingKey, value: boolean) => void
  clearAllLocal: () => void
}

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const defaultSettings: NotificationSettings = {
  booking: true,
  tournament: true,
  owner: true,
  system: true,
}

function getNotificationSettingKey(input: NotificationInput): NotificationSettingKey {
  if (input.type.includes("tournament")) return "tournament"
  if (input.type.includes("owner")) return "owner"
  if (input.type.includes("booking")) return "booking"
  return "system"
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      error: null,
      settings: defaultSettings,
      hasHydrated: false,

      addNotification: (input) => {
        const settingKey = getNotificationSettingKey(input)

        if (get().settings[settingKey] === false) {
          return ""
        }

        const id = makeId()

        const notification: AppNotification = {
          ...input,
          id,
          audience: input.audience ?? "both",
          createdAt: new Date().toISOString(),
          isRead: false,
        }

        set((state) => ({
          notifications: [notification, ...state.notifications],
          error: null,
        }))

        return id
      },

      setNotifications: (notifications) =>
        set((state) => {
          const map = new Map<string, AppNotification>()

          for (const item of notifications) {
            map.set(item.id, item)
          }

          for (const item of state.notifications) {
            map.set(item.id, item)
          }

          return {
            notifications: Array.from(map.values()).sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
            error: null,
          }
        }),

      setLoading: (value) => set({ isLoading: value }),

      setError: (error) => set({ error }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      markAsReadLocal: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, isRead: true } : item,
          ),
        })),

      markAllAsReadLocal: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({
            ...item,
            isRead: true,
          })),
        })),

      setSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        })),

      clearAllLocal: () => set({ notifications: [] }),
    }),
    {
      name: "hagzaya-notifications",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)