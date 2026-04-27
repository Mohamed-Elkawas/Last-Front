"use client"

// Temporary placeholder hook until real API integration is available.
import { useMockResource } from "@/features/backoffice/shared/hooks/use-mock-resource"
import type { OwnerRecord } from "@/features/backoffice/shared/types/entities"

export function useAdminOwners() {
  return useMockResource<OwnerRecord[]>({ initialData: [] })
}
