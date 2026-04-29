import type {
  CreateTournamentRegistrationInput,
  SubmitTournamentPaymentInput,
  TournamentDetail,
  TournamentRegistration,
  TournamentRegistrationResult,
  TournamentSummary,
} from "@/lib/types/tournament"
import type { InvitableUser } from "@/lib/types/tournament-invite"
import { repositoryListTournamentInvitableUsers } from "@/lib/repositories/local/tournament-invites.repository"
import {
  repositoryGetTournamentDetail,
  repositoryListTournamentSummaries,
} from "@/lib/repositories/local/tournaments.catalog.repository"
import { useTournamentRegistrationsStore } from "@/lib/tournament-registrations-store"

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function listTournamentSummaries(): Promise<TournamentSummary[]> {
  return repositoryListTournamentSummaries()
}

export function cleanupRegistrations() {
  const store = useTournamentRegistrationsStore.getState()
  const now = Date.now()

  const cleaned = store.listRegistrations().filter((registration) => {
    const expiresAt = registration.expiresAt
      ? new Date(registration.expiresAt).getTime()
      : 0

    if (
      registration.status === "pending_payment" &&
      expiresAt &&
      now >= expiresAt
    ) {
      return false
    }

    if (registration.status === "expired") return false
    if (registration.status === "cancelled") return false

    return true
  })

  useTournamentRegistrationsStore.setState({
    registrations: cleaned,
  })
}

export async function getTournamentById(
  id: string,
): Promise<TournamentDetail | null> {
  if (!id) return null

  cleanupRegistrations()

  const tournament = repositoryGetTournamentDetail(id)
  if (!tournament) return null

  const registrations = useTournamentRegistrationsStore
    .getState()
    .listRegistrations()
    .filter(
      (registration) =>
        registration.tournamentId === id &&
        registration.status !== "cancelled" &&
        registration.status !== "rejected" &&
        registration.status !== "expired",
    )

  return {
    ...tournament,
    teamsJoined: registrations.length,
    registeredTeams: registrations.map((registration) => {
      const captain =
        registration.players.find((player) => player.isCaptain) ??
        registration.players[0]

      return {
        id: registration.id,
        name: {
          ar: registration.teamName,
          en: registration.teamName,
        },
        players: registration.playersCount,
        captain: {
          id: captain?.id ?? registration.playerId,
          username: captain?.username ?? "captain",
          avatar: captain?.avatar ?? null,
        },
      }
    }),
  }
}

export async function createTournamentRegistration(
  input: CreateTournamentRegistrationInput,
): Promise<TournamentRegistrationResult> {
  const tournament = await getTournamentById(input.tournamentId)

  if (!tournament) {
    throw new Error("Tournament not found")
  }

  if (tournament.status !== "open") {
    throw new Error("Tournament is not open for registration")
  }

  // 🔥 منع تكرار اسم الفريق
  const normalizedTeamName = input.teamName.trim().toLowerCase()

  const isTeamNameTaken = useTournamentRegistrationsStore
    .getState()
    .listRegistrations()
    .some((registration) => {
      return (
        registration.tournamentId === input.tournamentId &&
        registration.status !== "cancelled" &&
        registration.status !== "expired" &&
        registration.status !== "rejected" &&
        registration.teamName.trim().toLowerCase() === normalizedTeamName
      )
    })

  if (isTeamNameTaken) {
    throw new Error("TEAM_NAME_ALREADY_EXISTS")
  }

  if (input.players.length < 5) {
    throw new Error("Tournament team must have at least 5 players")
  }

  const captain =
    input.players.find((player) => player.isCaptain) ?? input.players[0]

  const now = new Date().toISOString()

  const registration: TournamentRegistration = {
    id: createId("tr"),
    tournamentId: input.tournamentId,
    ownerId: tournament.ownerId,
    playerId: captain.id,
    teamName: input.teamName.trim(),
    players: input.players,
    playersCount: input.players.length,
    status: "pending_payment",
    paymentMethod: null,
    paymentReference: null,
    paymentScreenshotUrl: null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now,
  }

  useTournamentRegistrationsStore.getState().addRegistration(registration)

  return {
    registration,
    tournament,
  }
}

export function expireTournamentRegistration(registrationId: string) {
  const store = useTournamentRegistrationsStore.getState()
  store.removeRegistration(registrationId)
}

export async function submitTournamentPayment(
  input: SubmitTournamentPaymentInput,
): Promise<TournamentRegistration> {
  const store = useTournamentRegistrationsStore.getState()
  const registration = store.getRegistrationById(input.registrationId)

  if (!registration) {
    throw new Error("Tournament registration not found")
  }

  const expiresAt = registration.expiresAt
    ? new Date(registration.expiresAt).getTime()
    : 0

  if (expiresAt && Date.now() >= expiresAt) {
    store.removeRegistration(input.registrationId)
    throw new Error("Payment time expired")
  }

  if (registration.status !== "pending_payment") {
    throw new Error("This registration is not awaiting payment")
  }

  store.updateRegistration(input.registrationId, {
    status: "awaiting_owner_approval",
    paymentMethod: input.paymentMethod,
    paymentReference: null,
    paymentScreenshotUrl: input.paymentScreenshotUrl,
    updatedAt: new Date().toISOString(),
  })

  const updated = store.getRegistrationById(input.registrationId)

  if (!updated) {
    throw new Error("Tournament registration update failed")
  }

  return updated
}

export async function getTournamentRegistrationById(
  registrationId: string,
): Promise<(TournamentRegistration & { tournament?: TournamentDetail | null }) | null> {
  if (!registrationId) return null

  cleanupRegistrations()

  const registration = useTournamentRegistrationsStore
    .getState()
    .getRegistrationById(registrationId)

  if (!registration) return null

  const tournament = await getTournamentById(registration.tournamentId)

  return {
    ...registration,
    tournament,
  }
}

export async function listMyTournamentRegistrations(): Promise<
  Array<TournamentRegistration & { tournament?: TournamentDetail | null }>
> {
  cleanupRegistrations()

  const registrations = useTournamentRegistrationsStore
    .getState()
    .listRegistrations()

  return Promise.all(
    registrations.map(async (registration) => ({
      ...registration,
      tournament: await getTournamentById(registration.tournamentId),
    })),
  )
}

export async function listOwnerTournamentRegistrations(
  ownerId?: string,
): Promise<
  Array<TournamentRegistration & { tournament?: TournamentDetail | null }>
> {
  cleanupRegistrations()

  const registrations = useTournamentRegistrationsStore
    .getState()
    .listRegistrations()
    .filter((registration) => !ownerId || registration.ownerId === ownerId)

  return Promise.all(
    registrations.map(async (registration) => ({
      ...registration,
      tournament: await getTournamentById(registration.tournamentId),
    })),
  )
}

export async function approveTournamentRegistration(
  registrationId: string,
): Promise<TournamentRegistration> {
  const store = useTournamentRegistrationsStore.getState()

  store.updateRegistrationStatus(registrationId, "confirmed")

  const updated = store.getRegistrationById(registrationId)
  if (!updated) throw new Error("Tournament registration not found")

  return updated
}

export async function rejectTournamentRegistration(
  registrationId: string,
): Promise<TournamentRegistration> {
  const store = useTournamentRegistrationsStore.getState()

  store.updateRegistrationStatus(registrationId, "rejected")

  const updated = store.getRegistrationById(registrationId)
  if (!updated) throw new Error("Tournament registration not found")

  return updated
}

export async function listTournamentInvitableUsers(): Promise<InvitableUser[]> {
  return repositoryListTournamentInvitableUsers()
}

export const tournamentsService = {
  listTournamentSummaries,
  cleanupRegistrations,
  getTournamentById,
  createTournamentRegistration,
  expireTournamentRegistration,
  submitTournamentPayment,
  getTournamentRegistrationById,
  listMyTournamentRegistrations,
  listOwnerTournamentRegistrations,
  approveTournamentRegistration,
  rejectTournamentRegistration,
  listTournamentInvitableUsers,
}