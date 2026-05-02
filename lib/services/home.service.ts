import type { Playground } from "@/lib/types/playground"
import {
  getUpcomingTournaments,
  type TournamentRecord,
} from "@/lib/services/tournaments.api"

export type HomeFeaturedContent = {
  playgrounds: Playground[]
  tournaments: TournamentRecord[]
}

export async function getHomeFeatured(): Promise<HomeFeaturedContent> {
  const tournaments = await getUpcomingTournaments(2)

  return {
    playgrounds: [],
    tournaments,
  }
}
