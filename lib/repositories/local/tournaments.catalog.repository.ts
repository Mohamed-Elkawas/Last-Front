import {
  DEMO_TOURNAMENT_SUMMARIES,
  getDemoTournamentDetail,
} from "@/lib/data/demo/tournaments.demo"
import type { TournamentDetail, TournamentSummary } from "@/lib/types/tournament"

export function repositoryListTournamentSummaries(): TournamentSummary[] {
  return DEMO_TOURNAMENT_SUMMARIES
}

export function repositoryGetTournamentDetail(id: string): TournamentDetail | null {
  return getDemoTournamentDetail(id)
}
