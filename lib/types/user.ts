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
}

/** Persisted client profile until auth API exists (subset may be filled by backend later). */
export type UserProfileDraft = Omit<UserProfile, "id"> & { id?: EntityId }
