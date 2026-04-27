"use client"

import { useEffect, useMemo } from "react"
import { useBookingStore } from "@/lib/booking-store"
import { useOwnerAccessStore } from "@/lib/owner-access-store"
import { repositoryResolveOwnerPlaygroundScope } from "@/lib/repositories/local/owner-scope.repository"
import type { Booking } from "@/lib/types/booking"
import {
  approveBooking,
  markBookingPlayed,
  rejectBooking,
  requestOwnerReview,
  sweepBookingExpiry,
  toBookingDto,
} from "@/lib/services/bookings.service"

/**
 * Owner playground bookings + approve/reject.
 * Scope comes from owner access + catalog repository (no inline lists in pages).
 */
export function useOwnerBookings() {
  const raw = useBookingStore((s) => s.bookings)
  const hasHydrated = useBookingStore((s) => s.hasHydrated)
  const applicationStatus = useOwnerAccessStore((s) => s.applicationStatus)
  const ownedPlaygroundIds = useOwnerAccessStore((s) => s.ownedPlaygroundIds)

  useEffect(() => {
    sweepBookingExpiry()
    const interval = setInterval(sweepBookingExpiry, 30_000)
    return () => clearInterval(interval)
  }, [])

  const bookings: Booking[] = useMemo(() => raw.map(toBookingDto), [raw])

  const playgroundScopeIds = useMemo(
    () => repositoryResolveOwnerPlaygroundScope(applicationStatus, ownedPlaygroundIds),
    [applicationStatus, ownedPlaygroundIds],
  )

  /** Playground bookings for venues this owner operates (MVP: catalog scope). */
  const playgroundBookingsForOwner = useMemo(() => {
    if (playgroundScopeIds.length === 0) return []
    const idSet = new Set(playgroundScopeIds)
    return bookings
      .filter((b) => b.kind === "playground" && b.playground && idSet.has(b.playground.id))
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [bookings, playgroundScopeIds])

  const pendingApprovals = useMemo(
    () => playgroundBookingsForOwner.filter((b) => b.status === "awaiting_admin_approval"),
    [playgroundBookingsForOwner],
  )

  const pipelineBookings = useMemo(
    () =>
      playgroundBookingsForOwner.filter((b) =>
        ["pending_payment", "payment_submitted", "awaiting_admin_approval"].includes(b.status),
      ),
    [playgroundBookingsForOwner],
  )

  return {
    bookings,
    hasHydrated,
    playgroundBookingsForOwner,
    pendingApprovals,
    pipelineBookings,
    approveBooking,
    rejectBooking,
    requestOwnerReview,
    markBookingPlayed,
  }
}
