import { useFavoritesStore } from "@/lib/favorites-store"
import { repositoryGetPlaygroundsByIdsOrdered } from "@/lib/repositories/local/favorites.repository"
import type { Playground } from "@/lib/types/playground"
import { mockDelay } from "@/lib/services/mock-delay"

export function getFavoritePlaygroundIds(): string[] {
  return [...useFavoritesStore.getState().playgroundIds]
}

/** Synchronous resolve for hooks (matches future GET /favorites response shape). */
export function getFavoritePlaygroundsResolved(): Playground[] {
  const ids = useFavoritesStore.getState().playgroundIds
  return repositoryGetPlaygroundsByIdsOrdered(ids)
}

/** Async wrapper for parity with future HTTP client. */
export async function listFavoritePlaygrounds(): Promise<Playground[]> {
  await mockDelay(0)
  return getFavoritePlaygroundsResolved()
}

export function addFavoritePlayground(id: string): void {
  useFavoritesStore.getState().addPlaygroundId(id)
}

export function removeFavoritePlayground(id: string): void {
  useFavoritesStore.getState().removePlaygroundId(id)
}

export function toggleFavoritePlayground(id: string): void {
  useFavoritesStore.getState().togglePlaygroundId(id)
}

export function isFavoritePlaygroundId(id: string): boolean {
  return useFavoritesStore.getState().playgroundIds.includes(id)
}
