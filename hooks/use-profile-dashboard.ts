"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getProfileDashboardSnapshot,
  type ProfileDashboardSnapshot,
} from "@/lib/services/profile.service"

export function useProfileDashboard() {
  const [dashboard, setDashboard] = useState<ProfileDashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getProfileDashboardSnapshot()
      .then(setDashboard)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { dashboard, loading, error, reload: load }
}
