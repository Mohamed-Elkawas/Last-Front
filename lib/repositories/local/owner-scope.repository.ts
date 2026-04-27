import { repositoryListPlaygroundCatalogIds } from "@/lib/repositories/local/playgrounds.catalog.repository"
import type { OwnerApplicationStatus } from "@/lib/types/owner"

/**
 * Resolves which catalog playground ids an approved owner may see bookings for.
 * Empty `ownedPlaygroundIds` means "all catalog venues" until per-owner venue APIs exist.
 */
export function repositoryResolveOwnerPlaygroundScope(
  applicationStatus: OwnerApplicationStatus,
  ownedPlaygroundIds: string[],
): string[] {
  if (applicationStatus !== "approved") return []
  if (ownedPlaygroundIds.length > 0) return [...ownedPlaygroundIds]
  return repositoryListPlaygroundCatalogIds()
}
