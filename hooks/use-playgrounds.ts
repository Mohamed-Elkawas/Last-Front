"use client"

import { useCallback, useEffect, useState } from "react"
import type { Playground } from "@/lib/types/playground"
import { getPlaygroundById, listPlaygrounds } from "@/lib/services/playgrounds.service"
import { usePlaygroundsStore } from "@/lib/stores/playgrounds.store"

export function usePlaygroundsCatalog() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const userPlaygrounds = usePlaygroundsStore((state) => state.userPlaygrounds)

  const load = useCallback(() => {
    setLoading(true)
    listPlaygrounds()
      .then(setPlaygrounds)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load, userPlaygrounds])

  return { playgrounds, loading, error, reload: load }
}

export function usePlayground(id: string | undefined) {
  const [playground, setPlayground] = useState<Playground | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<Error | null>(null)

  const userPlaygrounds = usePlaygroundsStore((state) => state.userPlaygrounds)

  useEffect(() => {
    if (!id) {
      setPlayground(null)
      setLoading(false)
      return
    }

    setLoading(true)
    getPlaygroundById(id)
      .then(setPlayground)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [id, userPlaygrounds])

  return { playground, loading, error }
}