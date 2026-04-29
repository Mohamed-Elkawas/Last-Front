import type { EntityId, LocalizedString } from "@/lib/types/common"

export type PitchSizeLabel = "5v5" | "7v7" | "11v11" | string

export type EgyptGovernorateKey =
  | "all"
  | "cairo"
  | "giza"
  | "alexandria"
  | "dakahlia"
  | "red-sea"
  | "beheira"
  | "fayoum"
  | "gharbia"
  | "ismailia"
  | "monufia"
  | "minya"
  | "qalyubia"
  | "new-valley"
  | "suez"
  | "aswan"
  | "assiut"
  | "beni-suef"
  | "port-said"
  | "damietta"
  | "sharqia"
  | "south-sinai"
  | "kafr-el-sheikh"
  | "matrouh"
  | "luxor"
  | "qena"
  | "north-sinai"
  | "sohag"

export type Playground = {
  id: EntityId
  name: LocalizedString
  location: LocalizedString

  /**
   * API-ready fields.
   * Keep optional until backend contract is final.
   */
  cityKey?: string
  cityId?: EntityId
  governorateKey?: Exclude<EgyptGovernorateKey, "all">
  governorateId?: EntityId

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
  cityId?: EntityId
  governorateKey?: EgyptGovernorateKey
  governorateId?: EntityId
  pitchSizes?: PitchSizeLabel[]
}