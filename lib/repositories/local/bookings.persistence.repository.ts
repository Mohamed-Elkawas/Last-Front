import { useBookingStore } from "@/lib/booking-store"
import type {
  CreatePlaygroundBookingPayload,
  CreateTournamentBookingPayload,
  PaymentProof,
  PersistedBooking,
} from "@/lib/types/booking"

/**
 * Client persistence adapter for bookings until REST/WebSocket APIs exist.
 * Pages must not import this module — use `bookings.service` and booking hooks.
 */
export const bookingsPersistenceRepository = {
  list(): PersistedBooking[] {
    return useBookingStore.getState().bookings
  },

  createPlaygroundBooking(input: CreatePlaygroundBookingPayload): string {
    return useBookingStore.getState().createPlaygroundBooking(input)
  },

  createTournamentBooking(input: CreateTournamentBookingPayload): string {
    return useBookingStore.getState().createTournamentBooking(input)
  },

  submitPayment(bookingId: string, proof: PaymentProof, options?: { moveToAwaitingAdmin?: boolean }): void {
    useBookingStore.getState().submitPayment(bookingId, proof, options)
  },

  cancelBooking(bookingId: string): void {
    useBookingStore.getState().cancelBooking(bookingId)
  },

  clearCancelledBookings(): void {
    useBookingStore.getState().clearCancelledBookings()
  },

  approveBooking(bookingId: string): void {
    useBookingStore.getState().approveBooking(bookingId)
  },

  rejectBooking(bookingId: string): void {
    useBookingStore.getState().rejectBooking(bookingId)
  },

  moveToAwaitingAdminApproval(bookingId: string): void {
    useBookingStore.getState().moveToAwaitingAdminApproval(bookingId)
  },

  markBookingPlayed(bookingId: string): void {
    useBookingStore.getState().markBookingPlayed(bookingId)
  },

  markRated(bookingId: string): void {
    useBookingStore.getState().markRated(bookingId)
  },

  sweepExpired(): void {
    useBookingStore.getState().sweepExpired()
  },
}
