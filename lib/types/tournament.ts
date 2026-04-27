import type { EntityId, LocalizedString } from "@/lib/types/common"

export type TournamentStatus = "open" | "full" | "completed"

export type TournamentPrizeBreakdown = {
  first: number
  second: number
  bestPlayer: number
  bestGoalkeeper: number
}

export type TournamentSummary = {
  id: EntityId
  name: LocalizedString
  imageUrl: string
  venueName: LocalizedString
  scheduleLabel: LocalizedString
  entryFeePerTeam: number
  teamsJoined: number
  maxTeams: number
  status: TournamentStatus
  prize: TournamentPrizeBreakdown
}

export type TournamentTeamPreview = {
  name: string
  players: number
  captain: {
    username: string
    avatar: string | null
  }
}

export type TournamentDetail = TournamentSummary & {
  address: string
  formatLabel: string
  description: LocalizedString
  startDateLabel: LocalizedString
  endDateLabel: LocalizedString
  pointsEarned: {
    participation: number
    winner: number
    runnerUp: number
  }
  registeredTeams: TournamentTeamPreview[]
}
