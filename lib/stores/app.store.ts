"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
  CreatePlaygroundBookingPayload,
  CreateTournamentBookingPayload,
  PaymentProof,
  PersistedBooking,
} from "@/lib/types/booking"
import type { AppNotification, NotificationInput, NotificationSettingKey } from "@/lib/types/notification"
import type { PointsTransaction } from "@/lib/types/points"
import type { OwnerPersonalProfile, OwnerVenueProfile } from "@/lib/types/owner-profile"
import type { OwnerTournamentRecord } from "@/lib/types/owner-tournament"
import type { EntityId } from "@/lib/types/common"
import { useUserStore } from "@/lib/user-store"
import { clearLegacyPersistKeys, readLegacyPersistedSlices } from "@/lib/stores/app-store-migration"

const PAYMENT_WINDOW_MS = 10 * 60 * 1000

const defaultNotificationSettings: Record<NotificationSettingKey, boolean> = {
  booking: true,
  tournament: true,
  owner: true,
  system: true,
}

const defaultPersonal: OwnerPersonalProfile = {
  fullName: "Omar El-Masry",
  email: "owner@hagzaya.demo",
  phone: "+20 100 000 0000",
}

const defaultVenue: OwnerVenueProfile = {
  playgroundName: { en: "Heliopolis 5v5 Arena", ar: "أرينا هليوبوليس 5×5" },
  location: { en: "Heliopolis, Cairo", ar: "مصر الجديدة، القاهرة" },
  venuePhone: "+20 122 334 4555",
  paymentMethodsNote: "Vodafone Cash · InstaPay (same number as venue phone)",
  workingHours: "06:00 – 02:00 daily",
  pitchTypes: "5v5 turf · 7v7 grass · Indoor futsal",
  about: {
    en: "Premium small-sided pitches with floodlights, parking, and on-site staff for league nights.",
    ar: "ملاعب صغيرة مميزة بإضاءة قوية ومواقف سيارات وفريق في الموقع لأمسيات الدوري.",
  },
  coverImageUrl: "/images/playground-2.jpg",
  avatarUrl: "/images/playground-1.jpg",
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

export type NotificationAppState = {
  items: AppNotification[]
  settings: Record<NotificationSettingKey, boolean>
}

export type AppStoreState = {
  /** Playground + tournament join records (single source of truth). */
  bookings: PersistedBooking[]
  /** Notification inbox (shared feed; filter by `audience` in UI). */
  items: AppNotification[]
  settings: Record<NotificationSettingKey, boolean>
  balance: number
  transactions: PointsTransaction[]
  personal: OwnerPersonalProfile
  venue: OwnerVenueProfile
  tournaments: OwnerTournamentRecord[]
  hasHydrated: boolean

  // —— Booking domain ——
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

  // —— Facade aliases (spec-friendly names; same underlying rows) ——
  createBookingRequest: (input: CreatePlaygroundBookingPayload) => string
  approveBookingRequest: (requestId: string) => void
  rejectBookingRequest: (requestId: string) => void

  // —— Notifications ——
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

  // —— Points ——
  addTransaction: (input: Omit<PointsTransaction, "id" | "createdAt" | "balanceAfter">) => void

  // —— Owner profile ——
  setPersonal: (patch: Partial<OwnerPersonalProfile>) => void
  setVenue: (patch: Partial<OwnerVenueProfile>) => void

  // —— Owner tournaments ——
  publishTournament: (input: Omit<OwnerTournamentRecord, "id" | "createdAt" | "published" | "status">) => string
  endTournament: (tournamentId: string) => void

  /** Alias for tournament team registration rows. */
  joinTournament: (input: CreateTournamentBookingPayload) => string
  /** Alias for payment proof submission. */
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
      bookings: [
        {
          id: "bk_001",
          kind: "playground" as const,
          status: "confirmed" as const,
          createdAt: Date.now() - 86400000, // yesterday
          expiresAt: Date.now() + 86400000,
          playerDisplayName: "Cairo Eagles",
          playerPhone: "+20 100 000 0000",
          paymentMethod: "vodafone" as const,
          playground: {
            id: "pg_001",
            name: { en: "Field A", ar: "الحقل أ" },
            location: { en: "Heliopolis", ar: "هليوبوليس" },
            date: new Date().toISOString().split('T')[0], // today
            dateLabel: "Today",
            slots: "18:00 - 19:00",
            hours: 1,
            subtotal: 600,
            pointsDiscount: 0,
            total: 600,
          },
        },
        {
          id: "bk_002",
          kind: "playground" as const,
          status: "awaiting_admin_approval" as const,
          createdAt: Date.now() - 3600000,
          expiresAt: Date.now() + 86400000,
          playerDisplayName: "Mohamed Ali",
          playerPhone: "+20 122 334 4555",
          paymentMethod: "instapay" as const,
          payment: {
            payerName: "Mohamed Ali",
            paymentNumber: "01001234567",
            transactionReference: "TXN-123456",
          },
          paymentSubmittedAt: Date.now() - 1800000,
          playground: {
            id: "pg_002",
            name: { en: "Field B", ar: "الحقل ب" },
            location: { en: "Heliopolis", ar: "هليوبوليس" },
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
            dateLabel: "Tomorrow",
            slots: "20:00 - 21:00",
            hours: 1,
            subtotal: 450,
            pointsDiscount: 0,
            total: 450,
          },
        },
        {
          id: "bk_003",
          kind: "playground" as const,
          status: "confirmed" as const,
          createdAt: Date.now() - 86400000 * 2,
          expiresAt: Date.now() - 3600000, // past
          playerDisplayName: "Nasr Lions",
          playerPhone: "+20 133 445 5666",
          paymentMethod: "vodafone" as const,
          playedAt: Date.now() - 3600000,
          playground: {
            id: "pg_003",
            name: { en: "Field C", ar: "الحقل ج" },
            location: { en: "Heliopolis", ar: "هليوبوليس" },
            date: new Date().toISOString().split('T')[0], // today
            dateLabel: "Today",
            slots: "14:00 - 15:00",
            hours: 1,
            subtotal: 550,
            pointsDiscount: 0,
            total: 550,
          },
        },
      ],
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
            name: input.playgroundName,
            location: input.playgroundLocation,
            date: input.date,
            dateLabel: input.dateLabel,
            slots: input.slots,
            hours: input.hours,
            subtotal: input.subtotal,
            pointsDiscount: input.pointsDiscount,
            total: input.total,
          },
        }
        set((state) => ({ bookings: [booking, ...state.bookings] }))
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
        set((state) => ({ bookings: [booking, ...state.bookings] }))
        return id
      },

      submitPayment: (bookingId, proof, options) => {
        const shouldMove = options?.moveToAwaitingAdmin !== false
        set((state) => ({
          bookings: state.bookings.map((booking) => {
            if (booking.id !== bookingId) return booking
            if (booking.status !== "pending_payment") return booking
            return {
              ...booking,
              status: shouldMove ? "awaiting_admin_approval" : "payment_submitted",
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
            booking.id === bookingId && !["cancelled", "expired", "rejected"].includes(booking.status)
              ? { ...booking, status: "cancelled", cancelledAt: Date.now() }
              : booking,
          ),
        }))
      },

      clearCancelledBookings: () => {
        set((state) => ({
          bookings: state.bookings.filter((booking) => booking.status !== "cancelled"),
        }))
      },

      approveBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId && booking.status === "awaiting_admin_approval"
              ? { ...booking, status: "confirmed", approvedAt: Date.now() }
              : booking,
          ),
        }))
      },

      rejectBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((booking) => {
            if (booking.id !== bookingId) return booking
            const rejectable = ["awaiting_admin_approval", "payment_submitted", "pending_payment"].includes(
              booking.status,
            )
            if (!rejectable) return booking
            return { ...booking, status: "rejected", rejectedAt: Date.now() }
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
          createdAt: Date.now(),
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
          items: state.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
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

      setSetting: (key: NotificationSettingKey, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
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
          personal: { ...state.personal, ...patch },
        })),

      setVenue: (patch) =>
        set((state) => ({
          venue: { ...state.venue, ...patch },
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
        set((state) => ({ tournaments: [record, ...state.tournaments] }))
        return id
      },

      endTournament: (tournamentId) => {
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId ? { ...t, status: "ended" as const } : t
          ),
        }))
      },

      joinTournament: (input) => get().createTournamentBooking(input),

      updateBookingPayment: (bookingId, proof, options) => get().submitPayment(bookingId, proof, options),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "hagzaya-app",
      version: 1,
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
            if (legacy.bookings?.length && (!state.bookings || state.bookings.length === 0)) {
              state.bookings = legacy.bookings as PersistedBooking[]
            }
            if (legacy.items?.length && (!state.items || state.items.length === 0)) {
              state.items = legacy.items as AppNotification[]
            }
            if (legacy.notificationSettings) {
              state.settings = { ...defaultNotificationSettings, ...legacy.notificationSettings }
            }
            if (typeof legacy.balance === "number") {
              state.balance = legacy.balance
            }
            if (legacy.transactions?.length) {
              state.transactions = legacy.transactions as PointsTransaction[]
            }
            if (legacy.personal) {
              state.personal = { ...defaultPersonal, ...(legacy.personal as OwnerPersonalProfile) }
            }
            if (legacy.venue) {
              state.venue = { ...defaultVenue, ...(legacy.venue as OwnerVenueProfile) }
            }
            if (legacy.ownerTournaments?.length) {
              state.tournaments = legacy.ownerTournaments as OwnerTournamentRecord[]
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

/** @deprecated Prefer `useAppStore`; kept for backward compatibility with existing hooks. */
export const useBookingStore = useAppStore
export const useNotificationsStore = useAppStore
export const usePointsStore = useAppStore
export const useOwnerProfileStore = useAppStore
export const useOwnerTournamentsStore = useAppStore
