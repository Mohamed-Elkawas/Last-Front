import { useOwnerAccessStore } from "@/lib/owner-access-store"
import { repositoryListPlaygroundCatalogIds } from "@/lib/repositories/local/playgrounds.catalog.repository"
import type { OwnerApplicationStatus } from "@/lib/types/owner"
import { mockDelay } from "@/lib/services/mock-delay"

export type OwnerAccessSnapshot = {
  applicationStatus: OwnerApplicationStatus
  rejectionMessage: string | null
  ownedPlaygroundIds: string[]
}

export function getOwnerAccessSnapshot(): OwnerAccessSnapshot {
  const s = useOwnerAccessStore.getState()
  return {
    applicationStatus: s.applicationStatus,
    rejectionMessage: s.rejectionMessage,
    ownedPlaygroundIds: s.ownedPlaygroundIds,
  }
}

/** Call after owner registration form succeeds (maps to POST /owner/applications later). */
export async function submitOwnerApplication(): Promise<void> {
  await mockDelay(200)
  useOwnerAccessStore.getState().submitOwnerApplication()
}

/** Future admin API: approve owner and optionally bind venue ids. */
export async function approveOwnerApplication(ownedPlaygroundIds?: string[]): Promise<void> {
  await mockDelay(150)
  useOwnerAccessStore.getState().setOwnerApproved(ownedPlaygroundIds)
}

/** Future admin API: reject owner application. */
export async function rejectOwnerApplication(message?: string | null): Promise<void> {
  await mockDelay(150)
  useOwnerAccessStore.getState().setOwnerRejected(message ?? null)
}

/**
 * Local development only: approve current owner gate so `/owner` can be exercised without a backend.
 * No-op in production builds.
 */
export async function devSimulateAdminApproveOwner(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return
  await mockDelay(100)
  useOwnerAccessStore.getState().setOwnerApproved(repositoryListPlaygroundCatalogIds())
}
