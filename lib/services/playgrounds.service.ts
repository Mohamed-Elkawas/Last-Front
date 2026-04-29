import { repositoryListPlaygroundBookingSlotDefinitions } from "@/lib/repositories/local/booking-slots.repository"
import {
  repositoryGetPlaygroundById,
  repositoryListPlaygrounds,
} from "@/lib/repositories/local/playgrounds.catalog.repository"
import { usePlaygroundsStore } from "@/lib/stores/playgrounds.store"
import type { PlaygroundBookingSlotDefinition } from "@/lib/types/playground-booking"
import type { Playground, PlaygroundListQuery } from "@/lib/types/playground"
import { mockDelay } from "@/lib/services/mock-delay"

function matchesSearch(playground: Playground, search?: string) {
  if (!search?.trim()) return true

  const searchLower = search.trim().toLowerCase()

  return (
    playground.name.en.toLowerCase().includes(searchLower) ||
    playground.name.ar.toLowerCase().includes(searchLower) ||
    playground.location.en.toLowerCase().includes(searchLower) ||
    playground.location.ar.toLowerCase().includes(searchLower)
  )
}

function matchesGovernorate(playground: Playground, query?: PlaygroundListQuery) {
  if (!query?.governorateKey || query.governorateKey === "all") return true

  return playground.governorateKey === query.governorateKey
}

function matchesCity(playground: Playground, query?: PlaygroundListQuery) {
  if (!query?.cityKey) return true

  return playground.cityKey === query.cityKey
}

function matchesPitchSizes(playground: Playground, query?: PlaygroundListQuery) {
  if (!query?.pitchSizes?.length) return true

  return query.pitchSizes.some((size) => playground.pitchSizes.includes(size))
}

export async function listPlaygrounds(
  query?: PlaygroundListQuery,
): Promise<Playground[]> {
  await mockDelay()

  const store = usePlaygroundsStore.getState()

  const deletedIds = new Set(store.deletedPlaygroundIds)
  const demoPlaygrounds = repositoryListPlaygrounds(query)
  const userPlaygrounds = store.userPlaygrounds

  return [...demoPlaygrounds, ...userPlaygrounds].filter((playground) => {
    if (deletedIds.has(playground.id)) return false

    return (
      matchesSearch(playground, query?.search) &&
      matchesGovernorate(playground, query) &&
      matchesCity(playground, query) &&
      matchesPitchSizes(playground, query)
    )
  })
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

export async function createPlayground(
  playground: Omit<Playground, "id">,
): Promise<Playground> {
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
  updates: Partial<Playground>,
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