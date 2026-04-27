"use client"

import { useCallback, useEffect, useState } from "react"
import type { UserProfile } from "@/lib/types/user"
import { getCurrentUserProfile, updateCurrentUserProfile } from "@/lib/services/auth.service"

export function useAuthProfile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getCurrentUserProfile()
      .then(setUser)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = useCallback(
    async (patch: Parameters<typeof updateCurrentUserProfile>[0]) => {
      const next = await updateCurrentUserProfile(patch)
      setUser(next)
      return next
    },
    [],
  )

  return { user, loading, error, reload: load, updateProfile: update }
}
