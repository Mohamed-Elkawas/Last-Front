import type { EntityId, LocalizedString } from "@/lib/types/common"

export type PitchSizeLabel = "5v5" | "7v7" | "11v11" | string

export type Playground = {
  id: EntityId
  name: LocalizedString
  location: LocalizedString
  /** Filter / display region (demo); API may expose `cityId` instead. */
  cityKey: string
  price: { min: number; max: number }
  rating: number
  reviewCount: number
  imageUrl: string
  pitchSizes: PitchSizeLabel[]
  amenities: string[]
}

export type PlaygroundListQuery = {
  search?: string
  cityKey?: string
  pitchSizes?: PitchSizeLabel[]
}
