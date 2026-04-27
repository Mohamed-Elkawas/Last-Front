"use client"

import { useCallback, useEffect, useState } from "react"
import type { PlaygroundBookingSlotDefinition } from "@/lib/types/playground-booking"
import { listPlaygroundBookingSlotDefinitions } from "@/lib/services/playgrounds.service"

export function usePlaygroundBookingSlotDefinitions() {
  const [slots, setSlots] = useState<PlaygroundBookingSlotDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    listPlaygroundBookingSlotDefinitions()
      .then(setSlots)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { slots, loading, error, reload: load }
}
