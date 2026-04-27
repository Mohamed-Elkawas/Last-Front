"use client"

import { useCallback, useEffect, useState } from "react"
import type { HomeFeaturedContent } from "@/lib/services/home.service"
import { getHomeFeatured } from "@/lib/services/home.service"

export function useHomeFeatured() {
  const [data, setData] = useState<HomeFeaturedContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getHomeFeatured()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
