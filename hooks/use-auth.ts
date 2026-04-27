"use client"

import { useMemo } from "react"
import { useUserStore } from "@/lib/user-store"
import { signOut } from "@/lib/services/auth.service"
import { useAuthSessionStore } from "@/lib/auth-session-store"
import type { AuthSession } from "@/lib/types/auth"

/**
 * Client auth + profile slice until `useAuth` is backed by session tokens from the API.
 * Components should prefer this over reading `useUserStore` directly.
 */
export function useAuth() {
  const user = useUserStore((s) => s.user)
  const userHasHydrated = useUserStore((s) => s.hasHydrated)
  const updateUser = useUserStore((s) => s.updateUser)
  const persistedSession = useAuthSessionStore((s) => s.session)
  const sessionHasHydrated = useAuthSessionStore((s) => s.hasHydrated)

  const session = useMemo<AuthSession | null>(() => {
    if (!sessionHasHydrated || !persistedSession) return null
    return persistedSession
  }, [persistedSession, sessionHasHydrated])

  const hasHydrated = userHasHydrated && sessionHasHydrated
  const isAuthenticated = Boolean(session)
  const accountType = session?.accountType ?? null

  return {
    user,
    hasHydrated,
    isAuthenticated,
    session,
    accountType,
    updateUser,
    signOut,
  }
}
