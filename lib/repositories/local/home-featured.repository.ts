import { DEMO_HOME_PLAYGROUND_IDS, DEMO_HOME_TOURNAMENT_IDS } from "@/lib/data/demo/home.featured"
import { DEMO_PLAYGROUNDS } from "@/lib/data/demo/playgrounds.catalog"
import { DEMO_TOURNAMENT_SUMMARIES } from "@/lib/data/demo/tournaments.demo"
import type { Playground } from "@/lib/types/playground"
import type { TournamentSummary } from "@/lib/types/tournament"

export type HomeFeaturedRepositoryResult = {
  playgrounds: Playground[]
  tournaments: TournamentSummary[]
}

export function repositoryGetHomeFeatured(): HomeFeaturedRepositoryResult {
  const playgroundSet = new Set<string>(DEMO_HOME_PLAYGROUND_IDS)
  const tournamentSet = new Set<string>(DEMO_HOME_TOURNAMENT_IDS)
  return {
    playgrounds: DEMO_PLAYGROUNDS.filter((p) => playgroundSet.has(p.id)),
    tournaments: DEMO_TOURNAMENT_SUMMARIES.filter((t) => tournamentSet.has(t.id)),
  }
}
