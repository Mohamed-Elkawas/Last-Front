import { repositoryGetHomeFeatured } from "@/lib/repositories/local/home-featured.repository"
import type { Playground } from "@/lib/types/playground"
import type { TournamentSummary } from "@/lib/types/tournament"
import { mockDelay } from "@/lib/services/mock-delay"

export type HomeFeaturedContent = {
  playgrounds: Playground[]
  tournaments: TournamentSummary[]
}

export async function getHomeFeatured(): Promise<HomeFeaturedContent> {
  await mockDelay(80)
  return repositoryGetHomeFeatured()
}
