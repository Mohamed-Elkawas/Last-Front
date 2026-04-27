"use client"

import { useMemo } from "react"
import { computeOwnerDashboardMetrics, topBookedSlots } from "@/lib/domain/owner/dashboard-metrics"
import { useOwnerBookings } from "@/hooks/use-owner-bookings"

export function useOwnerDashboard() {
  const { playgroundBookingsForOwner, bookings, hasHydrated } = useOwnerBookings()

  const tournamentBookings = useMemo(() => bookings.filter((b) => b.kind === "tournament"), [bookings])

  const metrics = useMemo(
    () => computeOwnerDashboardMetrics(playgroundBookingsForOwner, tournamentBookings),
    [playgroundBookingsForOwner, tournamentBookings],
  )

  const topSlots = useMemo(() => topBookedSlots(metrics.slotCounts, 6), [metrics.slotCounts])

  return {
    hasHydrated,
    metrics,
    topSlots,
  }
}
