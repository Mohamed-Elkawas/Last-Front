"use client"

import { useMemo } from "react"
import type { Booking, BookingKind } from "@/lib/types/booking"
import { useBookings } from "@/hooks/use-bookings"

function matchesEntity(booking: Booking, kind: BookingKind, entityId: string) {
  return kind === "playground" ? booking.playground?.id === entityId : booking.tournament?.id === entityId
}

export function useBookingById(
  bookingId: string | null | undefined,
  kind?: BookingKind,
  fallbackEntityId?: string | null,
) {
  const { bookings, hasHydrated } = useBookings()

  const booking = useMemo<Booking | null>(() => {
    if (bookingId) {
      const byId = bookings.find((b) => b.id === bookingId && (kind === undefined || b.kind === kind))
      if (byId) return byId
    }

    if (!kind || !fallbackEntityId) return null

    return (
      [...bookings]
        .sort((a, b) => b.createdAt - a.createdAt)
        .find((b) => b.kind === kind && matchesEntity(b, kind, fallbackEntityId)) ?? null
    )
  }, [bookings, bookingId, fallbackEntityId, kind])

  return { booking, hasHydrated }
}
