"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type FavoritesStore = {
  /** Playground catalog ids, most recently favorited first. */
  playgroundIds: string[]
  hasHydrated: boolean
  addPlaygroundId: (id: string) => void
  removePlaygroundId: (id: string) => void
  togglePlaygroundId: (id: string) => void
  setHasHydrated: (value: boolean) => void
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set) => ({
      playgroundIds: [],
      hasHydrated: false,

      addPlaygroundId: (id) =>
        set((state) => {
          if (state.playgroundIds.includes(id)) return state
          return { playgroundIds: [id, ...state.playgroundIds.filter((x) => x !== id)] }
        }),

      removePlaygroundId: (id) =>
        set((state) => ({
          playgroundIds: state.playgroundIds.filter((x) => x !== id),
        })),

      togglePlaygroundId: (id) =>
        set((state) =>
          state.playgroundIds.includes(id)
            ? { playgroundIds: state.playgroundIds.filter((x) => x !== id) }
            : { playgroundIds: [id, ...state.playgroundIds.filter((x) => x !== id)] },
        ),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "hagzaya-favorites",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ playgroundIds: state.playgroundIds }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
