"use client"

import { useCallback, useEffect, useState } from "react"
import type {
  TournamentDetail,
  TournamentSummary,
} from "@/lib/types/tournament"
import {
  listTournamentSummaries,
  getTournamentById,
} from "@/lib/services/tournaments.service"

export function useTournamentSummaries() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listTournamentSummaries()
      setTournaments(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    tournaments,
    loading,
    error,
    reload: load,
  }
}

export function useTournamentDetail(id: string | undefined) {
  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await getTournamentById(id)
      setTournament(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return {
    tournament,
    loading,
    error,
    reload: load,
  }
}