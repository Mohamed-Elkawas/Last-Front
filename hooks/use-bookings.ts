"use client"

import { useEffect, useMemo } from "react"
import { useBookingStore } from "@/lib/booking-store"
import { useTournamentRegistrationsStore } from "@/lib/tournament-registrations-store"
import type { Booking, PaymentMethod } from "@/lib/types/booking"
import {
  cancelBooking,
  clearCancelledBookings,
  sweepBookingExpiry,
  toBookingDto,
} from "@/lib/services/bookings.service"
import {
  groupBookingsByTabs,
  isCancelableBooking,
} from "@/lib/domain/booking/selectors"

function mapTournamentPaymentMethod(method: string | null | undefined): PaymentMethod {
  return method === "instapay" ? "instapay" : "vodafone"
}

export function useBookings() {
  const raw = useBookingStore((s) => s.bookings)
  const hasHydrated = useBookingStore((s) => s.hasHydrated)

  const tournamentRegistrations = useTournamentRegistrationsStore(
    (s) => s.registrations,
  )

  useEffect(() => {
    sweepBookingExpiry()

    const interval = setInterval(sweepBookingExpiry, 30_000)

    return () => clearInterval(interval)
  }, [])

  const playgroundBookings: Booking[] = useMemo(
    () => raw.map(toBookingDto),
    [raw],
  )

  const tournamentBookings: Booking[] = useMemo(
    () =>
      tournamentRegistrations.map((registration) => ({
        id: registration.id,
        kind: "tournament",
        status:
          registration.status === "awaiting_owner_approval"
            ? "awaiting_admin_approval"
            : registration.status,
        paymentStatus:
          registration.status === "pending_payment"
            ? "awaiting_proof"
            : registration.status === "awaiting_owner_approval"
              ? "under_review"
              : registration.status === "confirmed"
                ? "captured"
                : registration.status === "expired" ||
                    registration.status === "rejected"
                  ? "failed"
                  : "none",
        createdAt: new Date(registration.createdAt).getTime(),
        expiresAt: registration.expiresAt
          ? new Date(registration.expiresAt).getTime()
          : Date.now(),
        paymentMethod: mapTournamentPaymentMethod(registration.paymentMethod),
        paymentSubmittedAt: registration.paymentScreenshotUrl
          ? new Date(registration.updatedAt).getTime()
          : undefined,
        tournament: {
          id: registration.tournamentId,
          name: {
            ar: registration.teamName,
            en: registration.teamName,
          },
          teamName: registration.teamName,
          players: registration.playersCount,
          total: 0,
        },
      })),
    [tournamentRegistrations],
  )

  const bookings: Booking[] = useMemo(
    () => [...playgroundBookings, ...tournamentBookings],
    [playgroundBookings, tournamentBookings],
  )

  const grouped = useMemo(() => groupBookingsByTabs(bookings), [bookings])

const cancelAnyBooking = (id: string) => {
  const tournamentRegistration = useTournamentRegistrationsStore
    .getState()
    .getRegistrationById(id)

  if (tournamentRegistration) {
    useTournamentRegistrationsStore
      .getState()
      .updateRegistrationStatus(id, "cancelled")
    return
  }

  cancelBooking(id)
}

return {
  bookings,
  upcomingBookings: grouped.upcoming,
  pastBookings: grouped.past,
  cancelledBookings: grouped.cancelled,
  hasHydrated,
  cancelBooking: cancelAnyBooking,
  clearCancelledBookings,
  isCancelableBooking,
}
}