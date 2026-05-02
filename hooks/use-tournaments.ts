"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getTournamentById,
  getTournaments,
  type TournamentRecord,
} from "@/lib/services/tournaments.api"

export function useTournamentSummaries(params?: {
  status?: string
  limit?: number
}) {
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTournaments(params)
      setTournaments(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [params?.limit, params?.status])

  useEffect(() => {
    void load()
  }, [load])

  return {
    tournaments,
    loading,
    error,
    reload: load,
  }
}

export function useTournamentDetail(id: string | undefined) {
  const [tournament, setTournament] = useState<TournamentRecord | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setTournament(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getTournamentById(id)
      setTournament(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
      setTournament(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  return {
    tournament,
    loading,
    error,
    reload: load,
  }
}
