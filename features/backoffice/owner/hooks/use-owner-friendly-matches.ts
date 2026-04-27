"use client"

// Temporary placeholder hook until real API integration is available.
import { useMockResource } from "@/features/backoffice/shared/hooks/use-mock-resource"

export function useOwnerFriendlyMatches() {
  return useMockResource({ initialData: [] as Array<Record<string, never>> })
}
