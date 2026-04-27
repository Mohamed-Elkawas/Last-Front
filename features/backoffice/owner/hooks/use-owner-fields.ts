"use client"

// Temporary placeholder hook until real API integration is available.
import { useMockResource } from "@/features/backoffice/shared/hooks/use-mock-resource"
import type { FieldRecord } from "@/features/backoffice/shared/types/entities"

export function useOwnerFields() {
  return useMockResource<FieldRecord[]>({ initialData: [] })
}
