"use client"

import { useOwnerProfileStore } from "@/lib/owner-profile-store"

export function useOwnerProfile() {
  const personal = useOwnerProfileStore((s) => s.personal)
  const venue = useOwnerProfileStore((s) => s.venue)
  const hasHydrated = useOwnerProfileStore((s) => s.hasHydrated)
  const setPersonal = useOwnerProfileStore((s) => s.setPersonal)
  const setVenue = useOwnerProfileStore((s) => s.setVenue)

  return {
    personal,
    venue,
    hasHydrated,
    setPersonal,
    setVenue,
  }
}
