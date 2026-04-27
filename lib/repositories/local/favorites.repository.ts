import { DEMO_PLAYGROUNDS } from "@/lib/data/demo/playgrounds.catalog"
import type { Playground } from "@/lib/types/playground"

/** Resolve catalog rows for persisted favorite ids (order preserved). */
export function repositoryGetPlaygroundsByIdsOrdered(ids: string[]): Playground[] {
  if (ids.length === 0) return []
  const byId = new Map(DEMO_PLAYGROUNDS.map((p) => [p.id, p]))
  return ids.map((id) => byId.get(id)).filter((p): p is Playground => p != null)
}
