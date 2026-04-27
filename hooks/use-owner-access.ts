"use client"

import { useOwnerAccessStore } from "@/lib/owner-access-store"

export function useOwnerAccess() {
  const applicationStatus = useOwnerAccessStore((s) => s.applicationStatus)
  const rejectionMessage = useOwnerAccessStore((s) => s.rejectionMessage)
  const ownedPlaygroundIds = useOwnerAccessStore((s) => s.ownedPlaygroundIds)
  const hasHydrated = useOwnerAccessStore((s) => s.hasHydrated)

  return {
    applicationStatus,
    rejectionMessage,
    ownedPlaygroundIds,
    hasHydrated,
    isReady: hasHydrated,
    isApproved: applicationStatus === "approved",
    isPending: applicationStatus === "pending",
    isRejected: applicationStatus === "rejected",
    isNone: applicationStatus === "none",
  }
}
