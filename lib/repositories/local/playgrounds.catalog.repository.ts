import { DEMO_PLAYGROUNDS } from "@/lib/data/demo/playgrounds.catalog"
import type { Playground, PlaygroundListQuery } from "@/lib/types/playground"

/** Local catalog source; replace with HTTP client when API is ready. */
export function repositoryListPlaygrounds(_query?: PlaygroundListQuery): Playground[] {
  return DEMO_PLAYGROUNDS
}

export function repositoryGetPlaygroundById(id: string): Playground | null {
  return DEMO_PLAYGROUNDS.find((p) => p.id === id) ?? null
}

export function repositoryListPlaygroundCatalogIds(): string[] {
  return DEMO_PLAYGROUNDS.map((p) => p.id)
}

export function repositoryCreatePlayground(
  playground: Omit<Playground, "id">,
): Playground {
  const newPlayground: Playground = {
    ...playground,
    id: `pg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }

  DEMO_PLAYGROUNDS.push(newPlayground)

  return newPlayground
}