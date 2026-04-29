import { bookingsPersistenceRepository } from "@/lib/repositories/local/bookings.persistence.repository"
import type {
  Booking,
  CreatePlaygroundBookingPayload,
  CreateTournamentBookingPayload,
  PaymentProof,
  PersistedBooking,
  BookingSlot,
} from "@/lib/types/booking"
import { derivePaymentStatus } from "@/lib/domain/booking/payment-status"
import { addLocalNotification } from "@/lib/notifications"
import {
  grantBookingRewardPoints,
  redeemPointsForBooking,
  refundRedeemedPoints,
  revokeBookingRewardPoints,
} from "@/lib/services/points.service"

export function toBookingDto(persisted: PersistedBooking): Booking {
  return {
    ...persisted,
    paymentStatus: derivePaymentStatus(persisted.status),
  }
}

export function getPersistedBookings(): PersistedBooking[] {
  return bookingsPersistenceRepository.list()
}

export async function createPlaygroundBooking(
  input: CreatePlaygroundBookingPayload,
): Promise<string> {
  if (!input.slots || input.slots.length === 0) {
    throw new Error("SLOTS_REQUIRED")
  }

  const bookingId = bookingsPersistenceRepository.createPlaygroundBooking(input)

  if (input.pointsDiscount > 0) {
    await redeemPointsForBooking(bookingId, Math.round(input.pointsDiscount))
  }

  return bookingId
}

export function createTournamentBooking(
  input: CreateTournamentBookingPayload,
): string {
  return bookingsPersistenceRepository.createTournamentBooking(input)
}

export async function submitBookingPayment(
  bookingId: string,
  proof: PaymentProof,
  options?: { moveToAwaitingAdmin?: boolean },
): Promise<void> {
  const previous = getPersistedBookings().find((b) => b.id === bookingId)

  bookingsPersistenceRepository.submitPayment(bookingId, proof, options)

  const next = getPersistedBookings().find((b) => b.id === bookingId)

  if (
    previous?.status === "pending_payment" &&
    next &&
    next.status !== previous.status
  ) {
    const bookingName =
      next.kind === "playground"
        ? next.playground?.name?.en || next.playground?.name?.ar || "playground"
        : next.tournament?.name || "tournament"

    const playerName = next.playerDisplayName || "A player"

    addLocalNotification({
      audience: "owner",
      type: "owner_booking_request",
      title: "New payment submitted",
      message: `${playerName} submitted payment for ${bookingName}.`,
    })

    const total = next.playground?.total ?? next.tournament?.total ?? 0

    if (total > 0) {
      await grantBookingRewardPoints(bookingId, total)
    }
  }
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const previous = getPersistedBookings().find((b) => b.id === bookingId)

  bookingsPersistenceRepository.cancelBooking(bookingId)

  const next = getPersistedBookings().find((b) => b.id === bookingId)

  if (
    previous &&
    previous.status !== "cancelled" &&
    next?.status === "cancelled"
  ) {
    const usedPoints = Math.round(next.playground?.pointsDiscount ?? 0)

    if (usedPoints > 0) {
      await refundRedeemedPoints(bookingId, usedPoints)
    }

    addLocalNotification({
      audience: "player",
      type: "booking_cancelled",
      title: "Booking cancelled",
      message: "Your booking has been cancelled.",
    })
  }
}

export function approveBooking(bookingId: string): void {
  const all = getPersistedBookings()
  const target = all.find((b) => b.id === bookingId)

  if (!target || target.kind !== "playground") return

  const hasConflict = all.some((b) => {
    if (b.id === target.id) return false

    return (
      b.kind === "playground" &&
      b.status === "confirmed" &&
      b.playground?.id === target.playground?.id &&
      b.playground?.date === target.playground?.date &&
      hasSlotConflict(b.playground?.slots, target.playground?.slots)
    )
  })

  if (hasConflict) {
    throw new Error("SLOT_ALREADY_BOOKED")
  }

  bookingsPersistenceRepository.approveBooking(bookingId)

  addLocalNotification({
    audience: "player",
    type: "booking_approved",
    title: "Booking approved",
    message: "Your booking has been approved.",
  })
}

function hasSlotConflict(a?: BookingSlot[], b?: BookingSlot[]) {
  if (!a || !b) return false

  return a.some((slotA) =>
    b.some((slotB) => slotA.slotKey === slotB.slotKey),
  )
}

export async function rejectBooking(bookingId: string): Promise<void> {
  const previous = getPersistedBookings().find((b) => b.id === bookingId)

  bookingsPersistenceRepository.rejectBooking(bookingId)

  const next = getPersistedBookings().find((b) => b.id === bookingId)

  if (previous?.status !== "rejected" && next?.status === "rejected") {
    const usedPoints = Math.round(next.playground?.pointsDiscount ?? 0)

    if (previous?.status === "pending_payment" && usedPoints > 0) {
      await refundRedeemedPoints(bookingId, usedPoints)
    }

    const paidTotal = next.playground?.total ?? next.tournament?.total ?? 0

    if (
      (previous?.status === "payment_submitted" ||
        previous?.status === "awaiting_admin_approval") &&
      paidTotal > 0
    ) {
      await revokeBookingRewardPoints(bookingId, paidTotal)
    }

    addLocalNotification({
      audience: "player",
      type: "booking_rejected",
      title: "Booking rejected",
      message: "Your booking has been rejected.",
    })
  }
}

export function requestOwnerReview(bookingId: string): void {
  bookingsPersistenceRepository.moveToAwaitingAdminApproval(bookingId)
}

export function markBookingPlayed(bookingId: string): void {
  bookingsPersistenceRepository.markBookingPlayed(bookingId)
}

export function markBookingRated(bookingId: string): void {
  bookingsPersistenceRepository.markRated(bookingId)
}

export function sweepBookingExpiry(): void {
  bookingsPersistenceRepository.sweepExpired()
}

export function clearCancelledBookings(): void {
  bookingsPersistenceRepository.clearCancelledBookings()
}