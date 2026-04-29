import type { EntityId, LocalizedString } from "@/lib/types/common"

export type TournamentStatus =
  | "draft"
  | "open"
  | "full"
  | "closed"
  | "live"
  | "completed"
  | "cancelled"

export type TournamentRegistrationStatus =
  | "pending_payment"
  | "payment_submitted"
  | "awaiting_owner_approval"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "expired"

export type TournamentPaymentMethod = "vodafone_cash" | "instapay"

export type TournamentPrizeBreakdown = {
  first: number
  second: number
  bestPlayer: number
  bestGoalkeeper: number
}

export type TournamentPointsBreakdown = {
  participation: number
  winner: number
  runnerUp: number
}

export type TournamentTeamPreview = {
  id: EntityId
  name: LocalizedString
  players: number
  captain: {
    id: EntityId
    username: string
    avatar: string | null
  }
}

export type TournamentSummary = {
  id: EntityId
  ownerId: EntityId
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

export type TournamentDetail = TournamentSummary & {
  address: string
  formatLabel: LocalizedString
  description: LocalizedString
  startDate: string
  endDate: string
  startDateLabel: LocalizedString
  endDateLabel: LocalizedString
  pointsEarned: TournamentPointsBreakdown
  registeredTeams: TournamentTeamPreview[]
}

export type TournamentJoinPlayer = {
  id: EntityId
  fullName: string
  username: string
  avatar: string | null
  isCaptain: boolean
}

export type TournamentRegistration = {
  id: EntityId
  tournamentId: EntityId
  ownerId: EntityId
  playerId: EntityId
  teamName: string
  players: TournamentJoinPlayer[]
  playersCount: number
  status: TournamentRegistrationStatus
  paymentMethod: TournamentPaymentMethod | null
  paymentReference: string | null
  paymentScreenshotUrl: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateTournamentRegistrationInput = {
  tournamentId: EntityId
  teamName: string
  players: TournamentJoinPlayer[]
}

export type SubmitTournamentPaymentInput = {
  registrationId: EntityId
  paymentMethod: TournamentPaymentMethod
  payerName: string
  payerPhone: string
  paymentScreenshotUrl: string
}

export type TournamentRegistrationResult = {
  registration: TournamentRegistration
  tournament: TournamentDetail
}