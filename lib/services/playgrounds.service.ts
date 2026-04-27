import { repositoryListPlaygroundBookingSlotDefinitions } from "@/lib/repositories/local/booking-slots.repository"
import {
  repositoryGetPlaygroundById,
  repositoryListPlaygrounds,
} from "@/lib/repositories/local/playgrounds.catalog.repository"
import { usePlaygroundsStore } from "@/lib/stores/playgrounds.store"
import type { PlaygroundBookingSlotDefinition } from "@/lib/types/playground-booking"
import type { Playground, PlaygroundListQuery } from "@/lib/types/playground"
import { mockDelay } from "@/lib/services/mock-delay"

export async function listPlaygrounds(query?: PlaygroundListQuery): Promise<Playground[]> {
  await mockDelay()

  const store = usePlaygroundsStore.getState()

  const deletedIds = new Set(store.deletedPlaygroundIds)
  const demoPlaygrounds = repositoryListPlaygrounds(query)
  const userPlaygrounds = store.userPlaygrounds

  let allPlaygrounds = [...demoPlaygrounds, ...userPlaygrounds].filter(
    (playground) => !deletedIds.has(playground.id)
  )

  if (query?.search) {
    const searchLower = query.search.toLowerCase()

    allPlaygrounds = allPlaygrounds.filter(
      (p) =>
        p.name.en.toLowerCase().includes(searchLower) ||
        p.name.ar.toLowerCase().includes(searchLower) ||
        p.location.en.toLowerCase().includes(searchLower) ||
        p.location.ar.toLowerCase().includes(searchLower)
    )
  }

  if (query?.cityKey) {
    allPlaygrounds = allPlaygrounds.filter((p) => p.cityKey === query.cityKey)
  }

  if (query?.pitchSizes && query.pitchSizes.length > 0) {
    allPlaygrounds = allPlaygrounds.filter((p) =>
      query.pitchSizes!.some((size) => p.pitchSizes.includes(size))
    )
  }

  return allPlaygrounds
}

export async function getPlaygroundById(id: string): Promise<Playground | null> {
  await mockDelay(80)

  const store = usePlaygroundsStore.getState()

  if (store.deletedPlaygroundIds.includes(id)) {
    return null
  }

  let playground = repositoryGetPlaygroundById(id)

  if (!playground) {
    playground = store.userPlaygrounds.find((p) => p.id === id) || null
  }

  return playground
}

export async function createPlayground(playground: Omit<Playground, "id">): Promise<Playground> {
  await mockDelay(100)

  const newPlayground: Playground = {
    ...playground,
    id: `pg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }

  usePlaygroundsStore.getState().addUserPlayground(newPlayground)

  return newPlayground
}

export async function updatePlayground(
  id: string,
  updates: Partial<Playground>
): Promise<Playground | null> {
  await mockDelay(100)

  const store = usePlaygroundsStore.getState()
  const existingPlayground = store.userPlaygrounds.find((p) => p.id === id)

  if (existingPlayground) {
    store.updateUserPlayground(id, updates)
    return { ...existingPlayground, ...updates }
  }

  return null
}


export async function deletePlayground(id: string): Promise<void> {
  await mockDelay(100)

  const store = usePlaygroundsStore.getState()

  store.removeUserPlayground(id)
  store.markPlaygroundDeleted(id)
}

export async function listPlaygroundBookingSlotDefinitions(): Promise<
  PlaygroundBookingSlotDefinition[]
> {
  await mockDelay(0)
  return repositoryListPlaygroundBookingSlotDefinitions()
}