"use client"

import { useMemo } from "react"
import { useOwnerAccess } from "@/hooks/use-owner-access"
import { useOwnerBookings as useOwnerBookingDomain } from "@/hooks/use-owner-bookings"
import { repositoryResolveOwnerPlaygroundScope } from "@/lib/repositories/local/owner-scope.repository"
import { repositoryListPlaygroundBookingSlotDefinitions } from "@/lib/repositories/local/booking-slots.repository"
import type { BookingSlot } from "@/lib/types/booking"

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function isSameMonth(dateValue: string, now: Date) {
  const date = new Date(`${dateValue}T00:00:00`)
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function resolveEndTime(date: string, slots?: BookingSlot[]) {
  const lastSlot = slots?.[slots.length - 1]
  const end = lastSlot?.endTime ?? "00:00"

  return new Date(`${date}T${end}:00`).getTime()
}

export function useOwnerOverview() {
  const { playgroundBookingsForOwner, bookings, hasHydrated } = useOwnerBookingDomain()
  const { applicationStatus, ownedPlaygroundIds } = useOwnerAccess()

  const data = useMemo(() => {
    const now = new Date()
    const todayKey = getTodayKey()
    const scopeIds = repositoryResolveOwnerPlaygroundScope(applicationStatus, ownedPlaygroundIds)

    const availableSlotsPerPlayground =
      repositoryListPlaygroundBookingSlotDefinitions().length

    const todayBookings = playgroundBookingsForOwner.filter(
      (booking) => booking.playground?.date === todayKey,
    )

    const confirmedToday = todayBookings.filter(
      (booking) => booking.status === "confirmed",
    )

    const revenueThisMonth = playgroundBookingsForOwner
      .filter(
        (booking) =>
          booking.status === "confirmed" &&
          booking.playground &&
          isSameMonth(booking.playground.date, now),
      )
      .reduce((sum, booking) => sum + (booking.playground?.total ?? 0), 0)

    const pendingPaymentReviews = playgroundBookingsForOwner.filter(
      (booking) =>
        booking.status === "awaiting_admin_approval" ||
        booking.status === "payment_submitted",
    ).length

    const revenueToday = confirmedToday.reduce(
      (sum, booking) => sum + (booking.playground?.total ?? 0),
      0,
    )

    const bookedHoursToday = todayBookings
      .filter((booking) => !["cancelled", "rejected", "expired"].includes(booking.status))
      .reduce((sum, booking) => sum + (booking.playground?.hours ?? 0), 0)

    const capacity = availableSlotsPerPlayground * scopeIds.length
    const utilizationRate =
      capacity > 0 ? Math.round((bookedHoursToday / capacity) * 1000) / 10 : 0

    const noShowCandidates = playgroundBookingsForOwner.filter((booking) => {
      if (booking.status !== "confirmed" || booking.playedAt || !booking.playground) {
        return false
      }

      return resolveEndTime(
        booking.playground.date,
        booking.playground.slots,
      ) < Date.now()
    }).length

    const tournamentsInProgress = bookings.filter(
      (booking) =>
        booking.kind === "tournament" &&
        (booking.status === "confirmed" ||
          booking.status === "awaiting_admin_approval" ||
          booking.status === "payment_submitted"),
    ).length

    return {
      bookingsToday: todayBookings.length,
      confirmedToday: confirmedToday.length,
      pendingPaymentReviews,
      revenueToday,
      revenueThisMonth,
      utilizationRate,
      noShowCandidates,
      tournamentsInProgress,
      actionAlerts:
        pendingPaymentReviews + noShowCandidates + tournamentsInProgress,
      upcomingBookingsSummary: playgroundBookingsForOwner.filter((booking) => {
        if (!booking.playground) return false

        return (
          new Date(`${booking.playground.date}T00:00:00`).getTime() >=
          new Date(`${todayKey}T00:00:00`).getTime()
        )
      }).length,
    }
  }, [applicationStatus, bookings, ownedPlaygroundIds, playgroundBookingsForOwner])

  return {
    data,
    isLoading: !hasHydrated,
    error: null,
  }
}