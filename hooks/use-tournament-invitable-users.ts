"use client"

import { useCallback, useEffect, useState } from "react"
import type { InvitableUser } from "@/lib/types/tournament-invite"
import { listTournamentInvitableUsers } from "@/lib/services/tournaments.service"

export function useTournamentInvitableUsers() {
  const [users, setUsers] = useState<InvitableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    listTournamentInvitableUsers()
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { users, loading, error, reload: load }
}
