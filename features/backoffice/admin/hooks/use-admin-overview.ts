"use client"

// Temporary placeholder hook until real API integration is available.
import { useMockResource } from "@/features/backoffice/shared/hooks/use-mock-resource"

export function useAdminOverview() {
  return useMockResource({
    initialData: {
      totalUsers: 18520,
      activeUsers: 9230,
      totalBookings: 58210,
      confirmedBookings: 50120,
      totalRevenue: 12450000,
      platformCommission: 996000,
      disputeCount: 84,
      suspiciousActivityAlerts: 17,
    },
  })
}
