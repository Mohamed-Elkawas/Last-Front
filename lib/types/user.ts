import type { EntityId } from "@/lib/types/common"

/** Canonical user shape for API integration. */
export type UserProfile = {
  id: EntityId
  fullName: string
  username: string
  email: string
  phoneNumber: string
  position: string
  points: number
  avatarUrl?: string | null

  age?: number
  gender?: string
  address?: string
  joinedAt?: string
}
export type UserProfileDraft = Omit<UserProfile, "id"> & { id?: EntityId }