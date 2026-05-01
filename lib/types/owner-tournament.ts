import type { LocalizedString } from "@/lib/types/common"
import type { TournamentPrizeBreakdown } from "@/lib/types/tournament"

export type OwnerTournamentRecord = {
  id: string
  createdAt: number
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
  published: boolean
status: "active" | "ended" | "completed"
}
