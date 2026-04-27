export type OwnerPersonalProfile = {
  fullName: string
  email: string
  phone: string
}

import type { LocalizedString } from "@/lib/types/common"

export type OwnerVenueProfile = {
  playgroundName: LocalizedString
  location: LocalizedString
  venuePhone: string
  paymentMethodsNote: string
  workingHours: string
  pitchTypes: string
  about: LocalizedString
  coverImageUrl: string
  avatarUrl: string
}