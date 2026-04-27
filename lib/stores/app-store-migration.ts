/**
 * Reads legacy persisted Zustand snapshots (per-feature keys) once and merges into unified state shape.
 */

type LegacyBookingPersist = {
  state?: {
    bookings?: unknown[]
    hasHydrated?: boolean
  }
  version?: number
}

type LegacyNotificationsPersist = {
  state?: {
    items?: unknown[]
    settings?: Record<string, boolean>
    hasHydrated?: boolean
  }
}

type LegacyPointsPersist = {
  state?: {
    balance?: number
    transactions?: unknown[]
    hasHydrated?: boolean
  }
}

type LegacyOwnerProfilePersist = {
  state?: {
    personal?: unknown
    venue?: unknown
    hasHydrated?: boolean
  }
}

type LegacyOwnerTournamentsPersist = {
  state?: {
    tournaments?: unknown[]
    hasHydrated?: boolean
  }
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export type LegacyMergedSlices = {
  bookings?: unknown[]
  items?: unknown[]
  notificationSettings?: Record<string, boolean>
  balance?: number
  transactions?: unknown[]
  personal?: unknown
  venue?: unknown
  ownerTournaments?: unknown[]
}

/** Pull data from standalone persist keys written before unified `hagzaya-app`. */
export function readLegacyPersistedSlices(): LegacyMergedSlices | null {
  if (typeof window === "undefined") return null

  const out: LegacyMergedSlices = {}
  let any = false

  const bookingsRoot = parseJson<LegacyBookingPersist>(localStorage.getItem("hagzaya-bookings"))
  if (bookingsRoot?.state?.bookings?.length) {
    out.bookings = bookingsRoot.state.bookings
    any = true
  }

  const notificationsRoot = parseJson<LegacyNotificationsPersist>(localStorage.getItem("hagzaya-notifications"))
  if (notificationsRoot?.state?.items?.length) {
    out.items = notificationsRoot.state.items
    any = true
  }
  if (notificationsRoot?.state?.settings && typeof notificationsRoot.state.settings === "object") {
    out.notificationSettings = notificationsRoot.state.settings as Record<string, boolean>
    any = true
  }

  const pointsRoot = parseJson<LegacyPointsPersist>(localStorage.getItem("hagzaya-points"))
  if (typeof pointsRoot?.state?.balance === "number") {
    out.balance = pointsRoot.state.balance
    any = true
  }
  if (pointsRoot?.state?.transactions?.length) {
    out.transactions = pointsRoot.state.transactions
    any = true
  }

  const profileRoot = parseJson<LegacyOwnerProfilePersist>(localStorage.getItem("hagzaya-owner-profile"))
  if (profileRoot?.state?.personal) {
    out.personal = profileRoot.state.personal
    any = true
  }
  if (profileRoot?.state?.venue) {
    out.venue = profileRoot.state.venue
    any = true
  }

  const ownerTourRoot = parseJson<LegacyOwnerTournamentsPersist>(localStorage.getItem("hagzaya-owner-tournaments"))
  if (ownerTourRoot?.state?.tournaments?.length) {
    out.ownerTournaments = ownerTourRoot.state.tournaments
    any = true
  }

  return any ? out : null
}

export function clearLegacyPersistKeys(): void {
  if (typeof window === "undefined") return
  const keys = [
    "hagzaya-bookings",
    "hagzaya-notifications",
    "hagzaya-points",
    "hagzaya-owner-profile",
    "hagzaya-owner-tournaments",
  ]
  for (const k of keys) {
    localStorage.removeItem(k)
  }
}
