"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
  CreatePlaygroundBookingPayload,
  CreateTournamentBookingPayload,
  PaymentProof,
  PersistedBooking,
} from "@/lib/types/booking"
import type {
  AppNotification,
  NotificationInput,
  NotificationSettingKey,
} from "@/lib/types/notification"
import type { PointsTransaction } from "@/lib/types/points"
import type {
  OwnerPersonalProfile,
  OwnerVenueProfile,
} from "@/lib/types/owner-profile"
import type { OwnerTournamentRecord } from "@/lib/types/owner-tournament"
import type { EntityId } from "@/lib/types/common"
import { useUserStore } from "@/lib/user-store"
import {
  clearLegacyPersistKeys,
  readLegacyPersistedSlices,
} from "@/lib/stores/app-store-migration"

const PAYMENT_WINDOW_MS = 10 * 60 * 1000

const defaultNotificationSettings: Record<NotificationSettingKey, boolean> = {
  booking: true,
  tournament: true,
  owner: true,
  system: true,
}

const defaultPersonal: OwnerPersonalProfile = {
  fullName: "",
  email: "",
  phone: "",
}

const defaultVenue: OwnerVenueProfile = {
  playgroundName: { en: "", ar: "" },
  location: { en: "", ar: "" },
  venuePhone: "",
  paymentMethodsNote: "",
  workingHours: "",
  pitchTypes: "",
  about: { en: "", ar: "" },
  coverImageUrl: "",
  avatarUrl: "",
}

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const makeOwnerTournamentId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `ot-${crypto.randomUUID()}`
  }

  return `ot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createSlotKey(
  playgroundId: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  return `${playgroundId}_${date}_${startTime}_${endTime}`
}



function normalizePlaygroundSlots(input: CreatePlaygroundBookingPayload) {
  if (!Array.isArray(input.slots)) return []

  return input.slots
    .filter((slot) => slot?.startTime && slot?.endTime)
    .map((slot) => ({
      startTime: String(slot.startTime),
      endTime: String(slot.endTime),
      slotKey:
        slot.slotKey ||
        createSlotKey(
          String(input.playgroundId),
          String(input.date),
          String(slot.startTime),
          String(slot.endTime),
        ),
    }))
}

export type NotificationAppState = {
  items: AppNotification[]
  settings: Record<NotificationSettingKey, boolean>
}

export type AppStoreState = {
  bookings: PersistedBooking[]
  items: AppNotification[]
  settings: Record<NotificationSettingKey, boolean>
  balance: number
  transactions: PointsTransaction[]
  personal: OwnerPersonalProfile
  venue: OwnerVenueProfile
  tournaments: OwnerTournamentRecord[]
  hasHydrated: boolean

  createPlaygroundBooking: (input: CreatePlaygroundBookingPayload) => string
  createTournamentBooking: (input: CreateTournamentBookingPayload) => string

  submitPayment: (
    bookingId: string,
    proof: PaymentProof,
    options?: { moveToAwaitingAdmin?: boolean },
  ) => void

  moveToAwaitingAdminApproval: (bookingId: string) => void
  cancelBooking: (bookingId: string) => void
  clearCancelledBookings: () => void
  approveBooking: (bookingId: string) => void
  rejectBooking: (bookingId: string) => void
  markBookingPlayed: (bookingId: string) => void
  markRated: (bookingId: string) => void
  sweepExpired: () => void

  createBookingRequest: (input: CreatePlaygroundBookingPayload) => string
  approveBookingRequest: (requestId: string) => void
  rejectBookingRequest: (requestId: string) => void

  addNotification: (input: NotificationInput) => EntityId
  addNotificationFor: (
    userType: "player" | "owner",
    input: Omit<NotificationInput, "audience">,
  ) => EntityId
  markAsRead: (id: EntityId) => void
  markAllAsRead: () => void
  removeNotification: (id: EntityId) => void
  clearAllNotifications: () => void
  setSetting: (key: NotificationSettingKey, value: boolean) => void

  addTransaction: (
    input: Omit<PointsTransaction, "id" | "createdAt" | "balanceAfter">,
  ) => void

  setPersonal: (patch: Partial<OwnerPersonalProfile>) => void
  setVenue: (patch: Partial<OwnerVenueProfile>) => void

  publishTournament: (
    input: Omit<
      OwnerTournamentRecord,
      "id" | "createdAt" | "published" | "status"
    >,
  ) => string
  endTournament: (tournamentId: string) => void
  completeTournament: (tournamentId: string) => void

  joinTournament: (input: CreateTournamentBookingPayload) => string
  updateBookingPayment: (
    bookingId: string,
    proof: PaymentProof,
    options?: { moveToAwaitingAdmin?: boolean },
  ) => void

  setHasHydrated: (value: boolean) => void
}

let legacyMigrationDone = false

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      bookings: [],
      items: [],
      settings: { ...defaultNotificationSettings },
      balance: 0,
      transactions: [],
      personal: defaultPersonal,
      venue: defaultVenue,
      tournaments: [],
      hasHydrated: false,

      createPlaygroundBooking: (input) => {
        const now = Date.now()
        const id = makeId()
        const slots = normalizePlaygroundSlots(input)

        if (!input.playgroundId) throw new Error("PLAYGROUND_ID_REQUIRED")
        if (!input.playgroundName) throw new Error("PLAYGROUND_NAME_REQUIRED")
        if (!input.playgroundLocation) {
          throw new Error("PLAYGROUND_LOCATION_REQUIRED")
        }
        if (!input.date) throw new Error("BOOKING_DATE_REQUIRED")
        if (!input.dateLabel) throw new Error("BOOKING_DATE_LABEL_REQUIRED")
        if (!slots.length) throw new Error("BOOKING_SLOTS_REQUIRED")
        if (!input.playerDisplayName) throw new Error("PLAYER_NAME_REQUIRED")
        if (!input.playerPhone) throw new Error("PLAYER_PHONE_REQUIRED")
        if (!input.paymentMethod) throw new Error("PAYMENT_METHOD_REQUIRED")
        if (!Number.isFinite(input.total) || input.total <= 0) {
          throw new Error("BOOKING_TOTAL_REQUIRED")
        }

        const booking: PersistedBooking = {
          id,
          kind: "playground",
          status: "pending_payment",
          createdAt: now,
          expiresAt: now + PAYMENT_WINDOW_MS,
          paymentMethod: input.paymentMethod,
          playerDisplayName: input.playerDisplayName,
          playerPhone: input.playerPhone,
          playground: {
            id: input.playgroundId,
            ownerId: (input as any).ownerId ?? "",
            name: input.playgroundName,
            location: input.playgroundLocation,
            date: input.date,
            dateLabel: input.dateLabel,
            slots,
            slotKeys: slots.map((slot) => slot.slotKey),
            hours: input.hours,
            subtotal: input.subtotal,
            pointsDiscount: input.pointsDiscount,
            total: input.total,
          } as any,
        }

        set((state) => ({
          bookings: [booking, ...state.bookings],
        }))

        return id
      },

      createTournamentBooking: (input) => {
        const now = Date.now()
        const id = makeId()

        const booking: PersistedBooking = {
          id,
          kind: "tournament",
          status: "pending_payment",
          createdAt: now,
          expiresAt: now + PAYMENT_WINDOW_MS,
          paymentMethod: input.paymentMethod,
          tournament: {
            id: input.tournamentId,
            name: input.tournamentName,
            teamName: input.teamName,
            players: input.players,
            total: input.total,
          },
        }

        set((state) => ({
          bookings: [booking, ...state.bookings],
        }))

        return id
      },

      submitPayment: (bookingId, proof, options) => {
        const shouldMove = options?.moveToAwaitingAdmin !== false

        set((state) => ({
          bookings: state.bookings.map((booking) => {
            if (booking.id !== bookingId) return booking
            if (booking.status !== "pending_payment") return booking

            if (Date.now() > booking.expiresAt) {
              return {
                ...booking,
                status: "expired",
              }
            }

            return {
              ...booking,
              status: shouldMove
                ? "awaiting_admin_approval"
                : "payment_submitted",
              paymentSubmittedAt: Date.now(),
              payment: proof,
            }
          }),
        }))
      },

      moveToAwaitingAdminApproval: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId && booking.status === "payment_submitted"
              ? { ...booking, status: "awaiting_admin_approval" }
              : booking,
          ),
        }))
      },

      cancelBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId &&
              !["cancelled", "expired", "rejected"].includes(booking.status)
              ? { ...booking, status: "cancelled", cancelledAt: Date.now() }
              : booking,
          ),
        }))
      },

      clearCancelledBookings: () => {
        set((state) => ({
          bookings: state.bookings.filter(
            (booking) => booking.status !== "cancelled",
          ),
        }))
      },

      approveBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId &&
              booking.status === "awaiting_admin_approval"
              ? { ...booking, status: "confirmed", approvedAt: Date.now() }
              : booking,
          ),
        }))
      },

      rejectBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((booking) => {
            if (booking.id !== bookingId) return booking

            const rejectable = [
              "awaiting_admin_approval",
              "payment_submitted",
              "pending_payment",
            ].includes(booking.status)

            if (!rejectable) return booking

            return {
              ...booking,
              status: "rejected",
              rejectedAt: Date.now(),
            }
          }),
        }))
      },

      markBookingPlayed: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId &&
              booking.status === "confirmed" &&
              !booking.playedAt
              ? {
                ...booking,
                status: "completed",
                playedAt: Date.now(),
              }
              : booking,
          ),
        }))
      },

      markRated: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId ? { ...booking, rated: true } : booking,
          ),
        }))
      },

      sweepExpired: () => {
        const now = Date.now()

        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.status === "pending_payment" && now > booking.expiresAt
              ? { ...booking, status: "expired" }
              : booking,
          ),
        }))
      },

      createBookingRequest: (input) => get().createPlaygroundBooking(input),

      approveBookingRequest: (requestId) => get().approveBooking(requestId),

      rejectBookingRequest: (requestId) => get().rejectBooking(requestId),

      addNotification: (input) => {
        const id = makeId()

        const row: AppNotification = {
          ...input,
          audience: input.audience ?? "both",
          id,
          createdAt: new Date().toISOString(),
          isRead: false,
        }

        set((state) => ({
          items: [row, ...state.items],
        }))

        return id
      },

      addNotificationFor: (userType, input) => {
        const audience = userType === "player" ? "player" : "owner"
        return get().addNotification({ ...input, audience })
      },

      markAsRead: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isRead: true } : item,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          items: state.items.map((item) => ({ ...item, isRead: true })),
        })),

      removeNotification: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      clearAllNotifications: () => set({ items: [] }),

      setSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        })),

      addTransaction: (input) => {
        const currentBalance = get().balance
        const nextBalance = Math.max(currentBalance + input.amount, 0)

        const tx: PointsTransaction = {
          ...input,
          id: makeId(),
          createdAt: Date.now(),
          balanceAfter: nextBalance,
        }

        set((state) => ({
          balance: nextBalance,
          transactions: [tx, ...state.transactions],
        }))

        useUserStore.getState().updateUser({ points: nextBalance })
      },

      setPersonal: (patch) =>
        set((state) => ({
          personal: {
            ...state.personal,
            ...patch,
          },
        })),

      setVenue: (patch) =>
        set((state) => ({
          venue: {
            ...state.venue,
            ...patch,
          },
        })),

      publishTournament: (input) => {
        const id = makeOwnerTournamentId()

        const record: OwnerTournamentRecord = {
          ...input,
          id,
          createdAt: Date.now(),
          published: true,
          status: "active",
        }

        set((state) => ({
          tournaments: [record, ...state.tournaments],
        }))

        return id
      },

      endTournament: (tournamentId) => {
        set((state) => ({
          tournaments: state.tournaments.map((tournament) =>
            tournament.id === tournamentId
              ? { ...tournament, status: "ended" as const }
              : tournament,
          ),
        }))
      },

      completeTournament: (tournamentId: string) => {
        set((state: AppStoreState) => ({
          tournaments: state.tournaments.map((tournament) =>
            tournament.id === tournamentId
              ? { ...tournament, status: "completed" as const }
              : tournament,
          ),
        }))
      },
      joinTournament: (input) => get().createTournamentBooking(input),

      updateBookingPayment: (bookingId, proof, options) =>
        get().submitPayment(bookingId, proof, options),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "hagzaya-app",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        items: state.items,
        settings: state.settings,
        balance: state.balance,
        transactions: state.transactions,
        personal: state.personal,
        venue: state.venue,
        tournaments: state.tournaments,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return

        if (!legacyMigrationDone) {
          const legacy = readLegacyPersistedSlices()
          legacyMigrationDone = true

          if (legacy) {
            if (legacy.items?.length && (!state.items || state.items.length === 0)) {
              state.items = legacy.items as AppNotification[]
            }

            if (legacy.notificationSettings) {
              state.settings = {
                ...defaultNotificationSettings,
                ...legacy.notificationSettings,
              }
            }

            if (typeof legacy.balance === "number") {
              state.balance = legacy.balance
            }

            if (legacy.transactions?.length) {
              state.transactions = legacy.transactions as PointsTransaction[]
            }

            clearLegacyPersistKeys()
          }
        }

        const userPoints = useUserStore.getState().user.points

        if (state.balance === 0 && userPoints > 0) {
          state.balance = userPoints
        }

        useUserStore.getState().updateUser({ points: state.balance })

        state.setHasHydrated(true)
        state.sweepExpired()
      },
    },
  ),
)

export const useBookingStore = useAppStore
export const useNotificationsStore = useAppStore
export const usePointsStore = useAppStore
export const useOwnerProfileStore = useAppStore
export const useOwnerTournamentsStore = useAppStore