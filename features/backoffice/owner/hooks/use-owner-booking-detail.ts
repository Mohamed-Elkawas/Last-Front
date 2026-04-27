"use client"

// Temporary placeholder hook until real API integration is available.
import { useMockResource } from "@/features/backoffice/shared/hooks/use-mock-resource"
import { bookingsMock } from "@/features/backoffice/shared/mocks/backoffice-dataset"
import type { BookingRecord } from "@/features/backoffice/shared/types/entities"

export function useOwnerBookingDetail(_bookingId: string) {
  return useMockResource<BookingRecord | null>({ initialData: bookingsMock.data[0] ?? null })
}
