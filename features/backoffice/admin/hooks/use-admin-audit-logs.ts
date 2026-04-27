"use client"

// Temporary placeholder hook until real API integration is available.
import { useMockResource } from "@/features/backoffice/shared/hooks/use-mock-resource"
import type { AuditLogRecord } from "@/features/backoffice/shared/types/entities"

export function useAdminAuditLogs() {
  return useMockResource<AuditLogRecord[]>({ initialData: [] })
}
