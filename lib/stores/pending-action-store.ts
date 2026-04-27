"use client"

import { create } from "zustand"
import type { EntityId } from "@/lib/types/common"

export type PendingAction =
  | { type: "playground_book"; playgroundId: string }
  | { type: "tournament_join"; tournamentId: string }
  | null

export type PendingActionStore = {
  action: PendingAction
  setAction: (action: PendingAction) => void
  clearAction: () => void
}

/**
 * Store for tracking pending actions that require authentication.
 * When a guest user tries to access a protected action, we store it here,
 * redirect to sign in, and then resume the action after successful auth.
 */
export const usePendingActionStore = create<PendingActionStore>((set) => ({
  action: null,
  setAction: (action) => set({ action }),
  clearAction: () => set({ action: null }),
}))
