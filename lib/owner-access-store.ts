"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { OwnerApplicationStatus } from "@/lib/types/owner"

export type OwnerAccessState = {
  applicationStatus: OwnerApplicationStatus
  /** Optional admin rejection note (future API). */
  rejectionMessage: string | null
  /** Catalog playground ids this owner operates; empty = all catalog ids (see owner-scope.repository). */
  ownedPlaygroundIds: string[]
  hasHydrated: boolean
  submitOwnerApplication: () => void
  setOwnerApproved: (ownedPlaygroundIds?: string[]) => void
  setOwnerRejected: (message?: string | null) => void
  resetOwnerAccess: () => void
  setHasHydrated: (value: boolean) => void
}

const initial = (): Pick<
  OwnerAccessState,
  "applicationStatus" | "rejectionMessage" | "ownedPlaygroundIds"
> => ({
  applicationStatus: "none",
  rejectionMessage: null,
  ownedPlaygroundIds: [],
})

export const useOwnerAccessStore = create<OwnerAccessState>()(
  persist(
    (set) => ({
      ...initial(),
      hasHydrated: false,

      submitOwnerApplication: () =>
        set({
          applicationStatus: "pending",
          rejectionMessage: null,
        }),

      setOwnerApproved: (ownedPlaygroundIds) =>
        set({
          applicationStatus: "approved",
          rejectionMessage: null,
          ownedPlaygroundIds: ownedPlaygroundIds ?? [],
        }),

      setOwnerRejected: (message) =>
        set({
          applicationStatus: "rejected",
          rejectionMessage: message ?? null,
        }),

      resetOwnerAccess: () => set(initial()),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "hagzaya-owner-access",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        applicationStatus: state.applicationStatus,
        rejectionMessage: state.rejectionMessage,
        ownedPlaygroundIds: state.ownedPlaygroundIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
