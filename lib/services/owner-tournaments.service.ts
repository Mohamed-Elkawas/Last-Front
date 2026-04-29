import { useOwnerTournamentsStore } from "@/lib/owner-tournaments-store"
import type { OwnerTournamentRecord } from "@/lib/types/owner-tournament"
import type { LocalizedString } from "@/lib/types/common"
import type { TournamentPrizeBreakdown } from "@/lib/types/tournament"

export type PublishOwnerTournamentInput = {
  name: LocalizedString
  description: LocalizedString
  entryFeePerTeam: number
  maxTeams: number
  scheduleLabel: LocalizedString
  startDateLabel: LocalizedString
  endDateLabel: LocalizedString
  imageUrl: string
  venueName: LocalizedString
  prize: TournamentPrizeBreakdown
}

export function publishOwnerTournament(input: PublishOwnerTournamentInput): string {
  const id = useOwnerTournamentsStore.getState().publishTournament({
    name: input.name,
    description: input.description,
    entryFeePerTeam: input.entryFeePerTeam,
    maxTeams: input.maxTeams,
    scheduleLabel: input.scheduleLabel,
    startDateLabel: input.startDateLabel,
    endDateLabel: input.endDateLabel,
    imageUrl: input.imageUrl,
    venueName: input.venueName,
    prize: input.prize,
  })

  return id
}

export function listOwnerPublishedTournaments(): OwnerTournamentRecord[] {
  return useOwnerTournamentsStore
    .getState()
    .tournaments
    .filter((tournament) => tournament.published)
}