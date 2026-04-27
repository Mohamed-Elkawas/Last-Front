"use client"

import { useEffect, useMemo } from "react"
import { useBookingStore } from "@/lib/booking-store"
import type { Booking } from "@/lib/types/booking"
import { cancelBooking, clearCancelledBookings, sweepBookingExpiry, toBookingDto } from "@/lib/services/bookings.service"
import { groupBookingsByTabs, isCancelableBooking } from "@/lib/domain/booking/selectors"

/** Player-facing bookings list + cancel (no owner approve/reject here). */
export function useBookings() {
  const raw = useBookingStore((s) => s.bookings)
  const hasHydrated = useBookingStore((s) => s.hasHydrated)

  useEffect(() => {
    sweepBookingExpiry()
    const interval = setInterval(sweepBookingExpiry, 30_000)
    return () => clearInterval(interval)
  }, [])

  const bookings: Booking[] = useMemo(() => raw.map(toBookingDto), [raw])
  const grouped = useMemo(() => groupBookingsByTabs(bookings), [bookings])

  return {
    bookings,
    upcomingBookings: grouped.upcoming,
    pastBookings: grouped.past,
    cancelledBookings: grouped.cancelled,
    hasHydrated,
    cancelBooking,
    clearCancelledBookings,
    isCancelableBooking,
  }
}
