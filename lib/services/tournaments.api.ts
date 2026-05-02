import { http } from "@/lib/API/http-client"
import type { LocalizedString } from "@/lib/types/common"

type HttpStatusPayload = {
  data?: unknown
  status?: number
  statusText?: string
  message?: string
  errors?: unknown
}

export type TournamentApiDto = {
  id?: string | number
  ownerId?: string | number
  fieldId?: string | number | null
  name?: string | { en?: string; ar?: string }
  numberOfTeams?: number | string
  maxTeams?: number | string
  prize?: string | { en?: string; ar?: string }
  description?: string | { en?: string; ar?: string }
  price?: number | string
  type?: string
  status?: string
  startDate?: string
  endDate?: string
  teamsJoined?: number | string
  joinedTeams?: number | string
  imageUrl?: string
  coverImage?: string
  createdAt?: string
  updatedAt?: string
}

export type TournamentRecord = {
  id: string
  ownerId: string | null
  fieldId: number | null
  name: LocalizedString
  description: LocalizedString
  prize: LocalizedString
  price: number
  type: string
  status: string
  numberOfTeams: number
  teamsJoined: number
  startDate: string
  endDate: string
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type CreateTournamentPayload = {
  name: string
  numberOfTeams: number
  prize: string
  description: string
  price: number
  type: string
  startDate: string
  endDate: string
  fieldId: number | null
}

export type CreateTeamPayload = {
  name: string
  tournamentId: number
}

export type CreateRewardPayload = {
  tournamentId: number
  firstPlace: string
  secondPlace: string
  thirdPlace: string
  theBestPlayer: string
  theBestGoalkeeper: string
}

export type TournamentMutationResult<T> = {
  data: T | null
  status: number | null
  message: string | null
}

type TournamentApiListResponse =
  | TournamentApiDto[]
  | { data?: TournamentApiDto[] }
  | { result?: TournamentApiDto[] }
  | { items?: TournamentApiDto[] }
  | { success?: boolean; data?: TournamentApiDto[] }
  | { success?: boolean; result?: TournamentApiDto[] }

function isHttpStatusPayload(value: unknown): value is HttpStatusPayload {
  return typeof value === "object" && value !== null && "status" in value
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function toLocalizedString(value: unknown): LocalizedString {
  if (!value) {
    return { en: "", ar: "" }
  }

  if (typeof value === "string") {
    return { en: value, ar: value }
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>
    const en = typeof obj.en === "string" ? obj.en : typeof obj.ar === "string" ? obj.ar : ""
    const ar = typeof obj.ar === "string" ? obj.ar : typeof obj.en === "string" ? obj.en : ""
    return { en, ar }
  }

  return { en: "", ar: "" }
}

function normalizeTournamentListResponse(data: unknown): TournamentApiDto[] {
  if (Array.isArray(data)) {
    return data
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>

    if (Array.isArray(obj.data)) {
      return obj.data as TournamentApiDto[]
    }

    if (Array.isArray(obj.result)) {
      return obj.result as TournamentApiDto[]
    }

    if (Array.isArray(obj.items)) {
      return obj.items as TournamentApiDto[]
    }
  }

  return []
}

function normalizeTournamentResponse(data: unknown): TournamentApiDto | null {
  if (!data) {
    return null
  }

  if (Array.isArray(data)) {
    return data[0] ?? null
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>

    if (obj.data && !Array.isArray(obj.data)) {
      return obj.data as TournamentApiDto
    }

    if (obj.result && !Array.isArray(obj.result)) {
      return obj.result as TournamentApiDto
    }

    if (obj.item && typeof obj.item === "object") {
      return obj.item as TournamentApiDto
    }

    return data as TournamentApiDto
  }

  return null
}

function getStatusMessage(response: HttpStatusPayload): string | null {
  if (typeof response.message === "string" && response.message.trim().length > 0) {
    return response.message
  }

  if (typeof response.statusText === "string" && response.statusText.trim().length > 0) {
    return response.statusText
  }

  return null
}

function buildMutationResult<T>(
  data: T | null,
  status: number | null,
  message: string | null,
): TournamentMutationResult<T> {
  return { data, status, message }
}

function mapTournamentDtoToRecord(item: TournamentApiDto): TournamentRecord {
  return {
    id: String(item.id ?? ""),
    ownerId:
      item.ownerId !== undefined && item.ownerId !== null ? String(item.ownerId) : null,
    fieldId:
      item.fieldId !== undefined && item.fieldId !== null
        ? toNumber(item.fieldId, 0)
        : null,
    name: toLocalizedString(item.name),
    description: toLocalizedString(item.description),
    prize: toLocalizedString(item.prize),
    price: toNumber(item.price, 0),
    type: toStringValue(item.type),
    status: toStringValue(item.status),
    numberOfTeams: toNumber(item.numberOfTeams ?? item.maxTeams, 0),
    teamsJoined: toNumber(item.teamsJoined ?? item.joinedTeams, 0),
    startDate: toStringValue(item.startDate),
    endDate: toStringValue(item.endDate),
    imageUrl: toStringValue(item.imageUrl || item.coverImage) || null,
    createdAt: toStringValue(item.createdAt),
    updatedAt: toStringValue(item.updatedAt),
  }
}

async function getList(url: string): Promise<TournamentRecord[]> {
  const response = await http<TournamentApiListResponse | HttpStatusPayload>(url)

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return []
  }

  return normalizeTournamentListResponse(response).map(mapTournamentDtoToRecord)
}

async function getSingle(url: string): Promise<TournamentRecord | null> {
  const response = await http<TournamentApiDto | HttpStatusPayload>(url)

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return null
  }

  const item = normalizeTournamentResponse(response)
  return item ? mapTournamentDtoToRecord(item) : null
}

export async function getTournaments(params?: {
  status?: string
  limit?: number
}): Promise<TournamentRecord[]> {
  const searchParams = new URLSearchParams()

  if (params?.status) {
    searchParams.set("status", params.status)
  }

  if (params?.limit) {
    searchParams.set("limit", String(params.limit))
  }

  const query = searchParams.toString()
  return getList(`/api/tournaments${query ? `?${query}` : ""}`)
}

export async function getUpcomingTournaments(limit?: number): Promise<TournamentRecord[]> {
  const searchParams = new URLSearchParams()

  if (limit) {
    searchParams.set("limit", String(limit))
  }

  const query = searchParams.toString()
  return getList(`/api/tournaments/upcoming${query ? `?${query}` : ""}`)
}

export async function getTournamentById(id: string | number): Promise<TournamentRecord | null> {
  return getSingle(`/api/tournaments/${encodeURIComponent(String(id))}`)
}

export async function createTournament(
  payload: CreateTournamentPayload,
): Promise<TournamentMutationResult<TournamentRecord>> {
  const response = await http<TournamentApiDto | HttpStatusPayload>("/api/tournaments", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult<TournamentRecord>(
      null,
      response.status,
      getStatusMessage(response),
    )
  }

  const item = normalizeTournamentResponse(response)
  return buildMutationResult(item ? mapTournamentDtoToRecord(item) : null, null, null)
}

export async function deleteTournament(
  id: string | number,
): Promise<TournamentMutationResult<null>> {
  const response = await http<unknown | HttpStatusPayload>(
    `/api/tournaments/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    },
  )

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult(null, response.status, getStatusMessage(response))
  }

  return buildMutationResult(null, null, null)
}

export async function createTeam(
  payload: CreateTeamPayload,
): Promise<TournamentMutationResult<{ id: string | null }>> {
  const response = await http<{ id?: string | number } | HttpStatusPayload>("/api/tournaments/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult<{ id: string | null }>(
      null,
      response.status,
      getStatusMessage(response),
    )
  }

  const item = normalizeTournamentResponse(response as unknown)
  const id =
    item?.id !== undefined && item?.id !== null ? String(item.id) : null

  return buildMutationResult({ id }, null, null)
}

export async function joinTournament(
  teamId: string | number,
  tournamentId: string | number,
): Promise<TournamentMutationResult<null>> {
  const response = await http<unknown | HttpStatusPayload>(
    `/api/tournaments/teams/${encodeURIComponent(String(teamId))}/join/${encodeURIComponent(String(tournamentId))}`,
    {
      method: "POST",
    },
  )

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult(null, response.status, getStatusMessage(response))
  }

  return buildMutationResult(null, null, null)
}

export async function createReward(
  payload: CreateRewardPayload,
): Promise<TournamentMutationResult<null>> {
  const response = await http<unknown | HttpStatusPayload>("/api/tournaments/rewards", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult(null, response.status, getStatusMessage(response))
  }

  return buildMutationResult(null, null, null)
}
