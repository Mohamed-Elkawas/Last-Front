"use client"

import { useCallback } from "react"
import { useAuthSessionStore } from "@/lib/auth-session-store"
import { usePendingActionStore, type PendingAction } from "@/lib/stores/pending-action-store"

/**
 * Helper to check if user is authenticated.
 * Returns true if user has an active session.
 */
export function useIsAuthenticated(): boolean {
  const session = useAuthSessionStore((state) => state.session)
  return session !== null
}

/**
 * Hook to guard protected actions.
 * If user is authenticated, allows action to proceed.
 * If not authenticated, stores pending action and signals to show auth dialog.
 *
 * Usage:
 * ```tsx
 * const { canProceed, showAuthDialog, setShowAuthDialog } = useRequireAuth()
 *
 * const handleBookPlayground = () => {
 *   if (!canProceed("playground_book", { playgroundId })) {
 *     return // Auth dialog will be shown
 *   }
 *   // Proceed with booking
 * }
 * ```
 */
export function useRequireAuth() {
  const isAuthenticated = useIsAuthenticated()
  const setAction = usePendingActionStore((state) => state.setAction)

  const canProceed = useCallback((actionType: NonNullable<PendingAction>["type"], actionData: Record<string, string>): boolean => {
    if (isAuthenticated) return true

    // Store the pending action
    const action: PendingAction =
      actionType === "playground_book"
        ? { type: "playground_book", playgroundId: actionData.playgroundId }
        : actionType === "tournament_join"
          ? { type: "tournament_join", tournamentId: actionData.tournamentId }
          : null

    if (action) {
      setAction(action)
    }

    return false
  }, [isAuthenticated, setAction])

  return {
    isAuthenticated,
    canProceed,
  }
}

/**
 * Hook to resume a pending action after successful authentication.
 * Called after sign-in/sign-up to continue the original action.
 */
export function useResumePendingAction() {
  const action = usePendingActionStore((state) => state.action)
  const clearAction = usePendingActionStore((state) => state.clearAction)

  const getRedirectPath = useCallback((): string | null => {
    if (!action) return null

    if (action.type === "playground_book") {
      return `/playgrounds/${action.playgroundId}/book`
    }

    if (action.type === "tournament_join") {
      return `/tournaments/${action.tournamentId}/join`
    }

    return null
  }, [action])

  return {
    action,
    redirectPath: getRedirectPath(),
    clearAction,
  }
}
