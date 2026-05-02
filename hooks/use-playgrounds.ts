"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Playground, PlaygroundListQuery } from "@/lib/types/playground"
import { getPlaygroundById as getLocalPlaygroundById, listPlaygrounds } from "@/lib/services/playgrounds.service"
import { getFieldById } from "@/lib/services/fields.api"
import { usePlaygroundsStore } from "@/lib/stores/playgrounds.store"

export function usePlaygroundsCatalog(query: PlaygroundListQuery = {}) {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const userPlaygrounds = usePlaygroundsStore((state) => state.userPlaygrounds)

  const queryKey = useMemo(() => JSON.stringify(query), [query])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)

    listPlaygrounds(query)
      .then(setPlaygrounds)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [queryKey])

  useEffect(() => {
    load()
  }, [load, userPlaygrounds])

  return { playgrounds, loading, error, reload: load }
}

export function usePlayground(id: string | undefined) {
  const [playground, setPlayground] = useState<Playground | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setPlayground(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    getFieldById(id)
      .then((field) => {
        setPlayground(field)
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error(String(e)))
        setPlayground(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  return { playground, loading, error }
}