"use client"

// Temporary placeholder hook until real API integration is available.
import { useMockResource } from "@/features/backoffice/shared/hooks/use-mock-resource"
import { paymentsMock } from "@/features/backoffice/shared/mocks/backoffice-dataset"

export function useAdminPayments() {
  return useMockResource({ initialData: paymentsMock.data })
}
