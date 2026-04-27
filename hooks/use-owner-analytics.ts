"use client"

import { useEffect, useMemo, useState } from "react"
import { useOwnerBookings } from "@/features/backoffice/owner/hooks/use-owner-bookings"
import { usePlaygroundsCatalog } from "@/hooks/use-playgrounds"
import { useOwnerAccess } from "@/hooks/use-owner-access"
import { OwnerAnalyticsService } from "@/lib/services/owner-analytics.service"
import type {
  BookingAnalytics,
  FieldUtilization,
  OwnerKPIs,
} from "@/lib/types/owner-analytics"
import type { Booking } from "@/lib/types/booking"

type OwnerAnalyticsState = {
  kpis: OwnerKPIs | null
  fieldUtilization: FieldUtilization[]
  bookingAnalytics: BookingAnalytics[]
  isLoading: boolean
  error: string | null
}

function normalizeBooking(record: any): Booking {
  return {
    ...record,

    kind: record.kind ?? "field_booking",

    status:
      record.status ??
      record.bookingStatus ??
      record.BookingStatus ??
      "pending_review",

    paymentStatus:
      record.paymentStatus ??
      record.PaymentStatus ??
      "submitted",

    createdAt:
      record.createdAt ??
      record.created_at ??
      record.date ??
      new Date().toISOString(),

    expiresAt:
      record.expiresAt ??
      record.expires_at ??
      new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }
}

export function useOwnerAnalytics(): OwnerAnalyticsState {
  const { data: rawBookings = [] } = useOwnerBookings()
  const { playgrounds } = usePlaygroundsCatalog()
  const { ownedPlaygroundIds } = useOwnerAccess()

  const ownedFields = useMemo(() => {
    const ids = new Set(ownedPlaygroundIds ?? [])
    return (playgrounds ?? []).filter((p) => ids.has(p.id))
  }, [playgrounds, ownedPlaygroundIds])

  const bookings = useMemo<Booking[]>(() => {
    return rawBookings.map(normalizeBooking)
  }, [rawBookings])

  const [state, setState] = useState<OwnerAnalyticsState>({
    kpis: null,
    fieldUtilization: [],
    bookingAnalytics: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let ignore = false

    async function loadAnalytics() {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }))

        const [kpis, fieldUtilization, bookingAnalytics] = await Promise.all([
          OwnerAnalyticsService.calculateKPIs(bookings, ownedFields),
          OwnerAnalyticsService.getFieldUtilization(bookings, ownedFields),
          OwnerAnalyticsService.getBookingAnalytics(bookings),
        ])

        if (ignore) return

        setState({
          kpis,
          fieldUtilization,
          bookingAnalytics,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        if (ignore) return

        setState({
          kpis: null,
          fieldUtilization: [],
          bookingAnalytics: [],
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load owner analytics",
        })
      }
    }

    loadAnalytics()

    return () => {
      ignore = true
    }
  }, [bookings, ownedFields])

  return state
}

export function useOwnerKPIs() {
  const { kpis, isLoading, error } = useOwnerAnalytics()

  return {
    kpis,
    isLoading,
    error,
  }
}