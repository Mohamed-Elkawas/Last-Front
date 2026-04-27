"use client"

import { useCallback, useMemo } from "react"
import { useFavoritesStore } from "@/lib/favorites-store"
import {
  addFavoritePlayground,
  getFavoritePlaygroundsResolved,
  removeFavoritePlayground,
  toggleFavoritePlayground,
} from "@/lib/services/favorites.service"
import type { Playground } from "@/lib/types/playground"

/**
 * Client favorites: single source of truth in `favorites-store`, resolved against catalog in service/repository.
 */
export function useFavoritePlaygrounds() {
  const playgroundIds = useFavoritesStore((s) => s.playgroundIds)
  const hasHydrated = useFavoritesStore((s) => s.hasHydrated)

  const playgrounds: Playground[] = useMemo(() => {
    if (!hasHydrated) return []
    return getFavoritePlaygroundsResolved()
  }, [playgroundIds, hasHydrated])

  const toggleFavorite = useCallback((id: string) => {
    toggleFavoritePlayground(id)
  }, [])

  const removeFavorite = useCallback((id: string) => {
    removeFavoritePlayground(id)
  }, [])

  const addFavorite = useCallback((id: string) => {
    addFavoritePlayground(id)
  }, [])

  const isFavorite = useCallback(
    (id: string) => playgroundIds.includes(id),
    [playgroundIds],
  )

  return {
    playgroundIds,
    playgrounds,
    loading: !hasHydrated,
    hasHydrated,
    toggleFavorite,
    removeFavorite,
    addFavorite,
    isFavorite,
  }
}
