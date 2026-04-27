import { bookingsPersistenceRepository } from "@/lib/repositories/local/bookings.persistence.repository"
import type {
  Booking,
  CreatePlaygroundBookingPayload,
  CreateTournamentBookingPayload,
  PaymentProof,
  PersistedBooking,
} from "@/lib/types/booking"
  import { derivePaymentStatus } from "@/lib/domain/booking/payment-status"
import { mockDelay } from "@/lib/services/mock-delay"
import { pushNotification } from "@/lib/services/notifications.service"
import {
  grantBookingRewardPoints,
  redeemPointsForBooking,
  refundRedeemedPoints,
  revokeBookingRewardPoints,
} from "@/lib/services/points.service"

function notifyBookingCreated(bookingId: string) {
  pushNotification({
    type: "booking_created",
    audience: "player",
    title: "Booking created",
    message: "Your playground booking has been created and is awaiting payment.",
    entityId: bookingId,
    entityType: "booking",
    actionHref: "/bookings",
  })
}

function notifyOwnerBookingRequest(bookingId: string, venueLabel: string) {
  pushNotification({
    type: "owner_booking_request",
    audience: "owner",
    title: "New booking request",
    message: `A player requested a slot at ${venueLabel}. Review the pipeline.`,
    entityId: bookingId,
    entityType: "booking",
    actionHref: "/owner/requests",
  })
}

function notifyOwnerPaymentReview(bookingId: string, venueLabel: string) {
  pushNotification({
    type: "owner_booking_payment",
    audience: "owner",
    title: "Payment proof received",
    message: `Payment was submitted for ${venueLabel}. You can review and decide.`,
    entityId: bookingId,
    entityType: "booking",
    actionHref: "/owner/requests",
  })
}

function notifyOwnerTournamentRegistration(bookingId: string, tournamentLabel: string, teamName: string) {
  pushNotification({
    type: "owner_tournament_registration",
    audience: "owner",
    title: "Tournament registration",
    message: `Team “${teamName}” joined ${tournamentLabel}. Track payment in bookings.`,
    entityId: bookingId,
    entityType: "tournament",
    actionHref: "/owner/tournaments",
  })
}

function notifyTournamentJoined(bookingId: string) {
  pushNotification({
    type: "tournament_joined",
    audience: "player",
    title: "Tournament join request created",
    message: "Your team registration was created and is awaiting payment confirmation.",
    entityId: bookingId,
    entityType: "tournament",
    actionHref: "/bookings",
  })
}

function notifyPaymentSubmitted(bookingId: string) {
  pushNotification({
    type: "payment_submitted",
    audience: "player",
    title: "Payment submitted",
    message: "Your payment proof was submitted successfully and is under review.",
    entityId: bookingId,
    entityType: "booking",
    actionHref: "/bookings",
  })
}

function notifyBookingCancelled(bookingId: string) {
  pushNotification({
    type: "booking_cancelled",
    audience: "player",
    title: "Booking cancelled",
    message: "Your booking has been cancelled.",
    entityId: bookingId,
    entityType: "booking",
    actionHref: "/bookings",
  })
}

function notifyBookingApproved(bookingId: string) {
  pushNotification({
    type: "booking_approved",
    audience: "player",
    title: "Booking confirmed",
    message: "An owner approved your booking.",
    entityId: bookingId,
    entityType: "booking",
    actionHref: "/bookings",
  })
}

function notifyBookingRejected(bookingId: string) {
  pushNotification({
    type: "booking_rejected",
    audience: "player",
    title: "Booking rejected",
    message: "Your booking was rejected by the venue owner.",
    entityId: bookingId,
    entityType: "booking",
    actionHref: "/bookings",
  })
}

export function toBookingDto(persisted: PersistedBooking): Booking {
  return {
    ...persisted,
    paymentStatus: derivePaymentStatus(persisted.status),
  }
}

export function getPersistedBookings(): PersistedBooking[] {
  return bookingsPersistenceRepository.list()
}

export function createPlaygroundBooking(input: CreatePlaygroundBookingPayload): string {
  const bookingId = bookingsPersistenceRepository.createPlaygroundBooking(input)
  if (input.pointsDiscount > 0) {
    redeemPointsForBooking(bookingId, Math.round(input.pointsDiscount))
  }
  notifyBookingCreated(bookingId)
  const venue =
    typeof input.playgroundName === "object"
      ? input.playgroundName.en || input.playgroundName.ar || "your venue"
      : String(input.playgroundName)
  notifyOwnerBookingRequest(bookingId, venue)
  return bookingId
}

export function createTournamentBooking(input: CreateTournamentBookingPayload): string {
  const bookingId = bookingsPersistenceRepository.createTournamentBooking(input)
  notifyTournamentJoined(bookingId)
  const tName =
    typeof input.tournamentName === "object"
      ? input.tournamentName.en || input.tournamentName.ar || "a tournament"
      : String(input.tournamentName)
  notifyOwnerTournamentRegistration(bookingId, tName, input.teamName)
  return bookingId
}

export async function submitBookingPayment(
  bookingId: string,
  proof: PaymentProof,
  options?: { moveToAwaitingAdmin?: boolean },
): Promise<void> {
  await mockDelay(200)
  const previous = bookingsPersistenceRepository.list().find((b) => b.id === bookingId)
  bookingsPersistenceRepository.submitPayment(bookingId, proof, options)
  const next = bookingsPersistenceRepository.list().find((b) => b.id === bookingId)
  if (previous?.status === "pending_payment" && next && next.status !== previous.status) {
    const total = next.playground?.total ?? next.tournament?.total ?? 0
    grantBookingRewardPoints(bookingId, total)
    notifyPaymentSubmitted(bookingId)
    const label =
      next.kind === "playground" && next.playground
        ? next.playground.name.en || next.playground.name.ar || "your venue"
        : next.tournament?.name.en || next.tournament?.name.ar || "tournament"
    notifyOwnerPaymentReview(bookingId, label)
  }
}

export function cancelBooking(bookingId: string): void {
  const previous = bookingsPersistenceRepository.list().find((b) => b.id === bookingId)
  bookingsPersistenceRepository.cancelBooking(bookingId)
  const next = bookingsPersistenceRepository.list().find((b) => b.id === bookingId)
  if (previous && previous.status !== "cancelled" && next?.status === "cancelled") {
    const usedPoints = Math.round(next.playground?.pointsDiscount ?? 0)
    if (usedPoints > 0) {
      refundRedeemedPoints(bookingId, usedPoints)
    }
    notifyBookingCancelled(bookingId)
  }
}

export function clearCancelledBookings(): void {
  bookingsPersistenceRepository.clearCancelledBookings()
}

function extractTimes(slotText: string): string[] {
  return slotText.match(/\b\d{2}:\d{2}\b/g) ?? []
}

function hasSlotOverlap(a?: string, b?: string) {
  const aTimes = extractTimes(a ?? "")
  const bTimes = extractTimes(b ?? "")

  return aTimes.some((time) => bTimes.includes(time))
}

export function approveBooking(bookingId: string): void {
  const allBookings = bookingsPersistenceRepository.list()
  const target = allBookings.find((b) => b.id === bookingId)

  if (!target) return

  const hasConflict = allBookings.some((booking) => {
    if (booking.id === target.id) return false

    return (
      booking.kind === "playground" &&
      target.kind === "playground" &&
      booking.status === "confirmed" &&
      booking.playground?.id === target.playground?.id &&
      booking.playground?.date === target.playground?.date &&
      hasSlotOverlap(booking.playground?.slots, target.playground?.slots)
    )
  })

  if (hasConflict) {
    throw new Error("المعاد ده متحجز بالفعل ومينفعش توافق عليه")
  }

  const previous = target

  bookingsPersistenceRepository.approveBooking(bookingId)

  const next = bookingsPersistenceRepository.list().find((b) => b.id === bookingId)

  if (previous?.status !== "confirmed" && next?.status === "confirmed") {
    notifyBookingApproved(bookingId)
  }
}

export function rejectBooking(bookingId: string): void {
  const previous = bookingsPersistenceRepository.list().find((b) => b.id === bookingId)
  bookingsPersistenceRepository.rejectBooking(bookingId)
  const next = bookingsPersistenceRepository.list().find((b) => b.id === bookingId)
  if (previous?.status !== "rejected" && next?.status === "rejected") {
    const usedPoints = Math.round(next.playground?.pointsDiscount ?? 0)
    if (previous?.status === "pending_payment" && usedPoints > 0) {
      refundRedeemedPoints(bookingId, usedPoints)
    }
    const paidTotal = next.playground?.total ?? next.tournament?.total ?? 0
    if (
      (previous?.status === "payment_submitted" || previous?.status === "awaiting_admin_approval") &&
      paidTotal > 0
    ) {
      revokeBookingRewardPoints(bookingId, paidTotal)
    }
    notifyBookingRejected(bookingId)
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
