import { repositoryListTournamentInvitableUsers } from "@/lib/repositories/local/tournament-invites.repository"
import {
  repositoryGetTournamentDetail,
  repositoryListTournamentSummaries,
} from "@/lib/repositories/local/tournaments.catalog.repository"
import { bookingsPersistenceRepository } from "@/lib/repositories/local/bookings.persistence.repository"
import { ownerRecordToDetail, ownerRecordToSummary } from "@/lib/domain/tournament/catalog-merge"
import { listOwnerPublishedTournaments } from "@/lib/services/owner-tournaments.service"
import type { TournamentDetail, TournamentSummary } from "@/lib/types/tournament"
import type { InvitableUser } from "@/lib/types/tournament-invite"
import { mockDelay } from "@/lib/services/mock-delay"

export async function listTournamentSummaries(): Promise<TournamentSummary[]> {
  await mockDelay()
  const base = repositoryListTournamentSummaries()
  const ownerPublished = listOwnerPublishedTournaments()
  const bookings = bookingsPersistenceRepository.list()
  const merged = ownerPublished.map((r) => ownerRecordToSummary(r, bookings))
  return [...merged, ...base]
}

export async function getTournamentById(id: string): Promise<TournamentDetail | null> {
  await mockDelay(80)
  if (id.startsWith("ot-")) {
    const ownerPublished = listOwnerPublishedTournaments()
    const record = ownerPublished.find((t) => t.id === id)
    if (!record) return null
    return ownerRecordToDetail(record, bookingsPersistenceRepository.list())
  }
  return repositoryGetTournamentDetail(id)
}

/** Teammate roster search for join flow; replace with user search API later. */
export async function listTournamentInvitableUsers(): Promise<InvitableUser[]> {
  await mockDelay(40)
  return repositoryListTournamentInvitableUsers()
}
