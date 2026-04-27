"use client"

import { useCallback, useEffect, useState } from "react"
import { useBookingStore } from "@/lib/booking-store"
import { useOwnerTournamentsStore } from "@/lib/owner-tournaments-store"
import type { TournamentDetail, TournamentSummary } from "@/lib/types/tournament"
import { getTournamentById, listTournamentSummaries } from "@/lib/services/tournaments.service"

export function useTournamentSummaries() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const ownerTournaments = useOwnerTournamentsStore((s) => s.tournaments)
  const bookings = useBookingStore((s) => s.bookings)

  const load = useCallback(() => {
    setLoading(true)
    listTournamentSummaries()
      .then(setTournaments)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load, ownerTournaments, bookings])

  return { tournaments, loading, error, reload: load }
}

export function useTournamentDetail(id: string | undefined) {
  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<Error | null>(null)
  const ownerTournaments = useOwnerTournamentsStore((s) => s.tournaments)
  const bookings = useBookingStore((s) => s.bookings)

  useEffect(() => {
    if (!id) {
      setTournament(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getTournamentById(id)
      .then(setTournament)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [id, ownerTournaments, bookings])

  return { tournament, loading, error }
}
