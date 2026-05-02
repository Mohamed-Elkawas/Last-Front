import { http } from "@/lib/API/http-client"
import type { LocalizedString } from "@/lib/types/common"
import type { Playground } from "@/lib/types/playground"

type HttpStatusPayload = {
  data?: unknown
  status?: number
  statusText?: string
  message?: string
  errors?: unknown
}

export type FieldApiDto = {
  id?: string | number
  ownerId?: string | number
  name?: string | { en?: string; ar?: string }
  city?: string
  village?: string
  address?: string
  governorate?: string
  photos?: string | string[]
  images?: string | string[]
  type?: string
  priceAm?: number | string
  pricePm?: number | string
  price?: { min?: number | string; max?: number | string }
  latitude?: number | string
  longitude?: number | string
  capacity?: number | string
  surface?: string | number
  openingTime?: string
  closingTime?: string
  amenities?: string[]
  rating?: number | string
  reviewCount?: number | string
  status?: string
  rejectionReason?: string
  adminNotes?: string
  createdAt?: string
  updatedAt?: string
}

export type FieldRecord = Playground & {
  ownerId?: string
  city: string
  village: string
  address: string
  governorate: string
  photos: string[]
  type: string
  priceAm: number
  pricePm: number
  latitude: number | null
  longitude: number | null
  capacity: number | null
  surface: string
  openingTime: string
  closingTime: string
  status: string
  rejectionReason: string
  adminNotes: string
  createdAt: string
  updatedAt: string
}

export type FieldMutationPayload = {
  name: string
  city: string
  village?: string
  address: string
  governorate?: string
  type: string
  priceAm: number
  pricePm: number
  photos: string
  amenities?: string[]
  capacity?: number | null
  surface?: string
  openingTime?: string
  closingTime?: string
  latitude?: number | null
  longitude?: number | null
}

export type FieldMutationResult<T> = {
  data: T | null
  message: string | null
  status: number | null
}

type FieldApiListResponse =
  | FieldApiDto[]
  | { data?: FieldApiDto[] }
  | { result?: FieldApiDto[] }
  | { items?: FieldApiDto[] }
  | { success?: boolean; result?: FieldApiDto[] }
  | { success?: boolean; data?: FieldApiDto[] }

function isHttpStatusPayload(value: unknown): value is HttpStatusPayload {
  return typeof value === "object" && value !== null && "status" in value
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

function toPhotoArray(value: unknown): string[] {
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()]
  }

  return toStringArray(value)
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

function buildLocation(field: FieldApiDto): LocalizedString {
  const parts = [field.address, field.village, field.city, field.governorate].filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  )

  const location = parts.join(", ")
  return { en: location, ar: location }
}

function normalizeFieldListResponse(data: unknown): FieldApiDto[] {
  if (Array.isArray(data)) {
    return data
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>

    if (Array.isArray(obj.data)) {
      return obj.data as FieldApiDto[]
    }

    if (Array.isArray(obj.result)) {
      return obj.result as FieldApiDto[]
    }

    if (Array.isArray(obj.items)) {
      return obj.items as FieldApiDto[]
    }
  }

  return []
}

function normalizeFieldResponse(data: unknown): FieldApiDto | null {
  if (!data) {
    return null
  }

  if (Array.isArray(data)) {
    return data[0] ?? null
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>

    if (obj.data && !Array.isArray(obj.data)) {
      return obj.data as FieldApiDto
    }

    if (obj.result && !Array.isArray(obj.result)) {
      return obj.result as FieldApiDto
    }

    if (obj.item && typeof obj.item === "object") {
      return obj.item as FieldApiDto
    }

    return data as FieldApiDto
  }

  return null
}

function mapFieldDtoToRecord(field: FieldApiDto): FieldRecord {
  const name = toLocalizedString(field.name)
  const photos = toPhotoArray(field.photos ?? field.images)
  const priceAm = toNumber(field.priceAm ?? field.price?.min, 0)
  const pricePm = toNumber(field.pricePm ?? field.price?.max ?? field.priceAm ?? field.price?.min, priceAm)

  return {
    id: String(field.id ?? ""),
    ownerId:
      field.ownerId !== undefined && field.ownerId !== null ? String(field.ownerId) : undefined,
    name,
    location: buildLocation(field),
    cityKey: toStringValue(field.city),
    price: {
      min: priceAm,
      max: pricePm,
    },
    rating: toNumber(field.rating, 0),
    reviewCount: toNumber(field.reviewCount, 0),
    imageUrl: photos[0] ?? "/placeholder.jpg",
    pitchSizes: field.type ? [field.type] : [],
    amenities: toStringArray(field.amenities),
    city: toStringValue(field.city),
    village: toStringValue(field.village),
    address: toStringValue(field.address),
    governorate: toStringValue(field.governorate),
    photos,
    type: toStringValue(field.type),
    priceAm,
    pricePm,
    latitude: toNullableNumber(field.latitude),
    longitude: toNullableNumber(field.longitude),
    capacity: toNullableNumber(field.capacity),
    surface: field.surface === undefined || field.surface === null ? "" : String(field.surface),
    openingTime: toStringValue(field.openingTime),
    closingTime: toStringValue(field.closingTime),
    status: toStringValue(field.status),
    rejectionReason: toStringValue(field.rejectionReason),
    adminNotes: toStringValue(field.adminNotes),
    createdAt: toStringValue(field.createdAt),
    updatedAt: toStringValue(field.updatedAt),
  }
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
): FieldMutationResult<T> {
  return { data, status, message }
}

function buildFieldPayload(payload: FieldMutationPayload): Record<string, unknown> {
  return {
    name: payload.name,
    city: payload.city,
    village: payload.village ?? "",
    address: payload.address,
    governorate: payload.governorate ?? "",
    type: payload.type,
    photos: payload.photos,
    amenities: payload.amenities ?? [],
    priceAm: payload.priceAm,
    pricePm: payload.pricePm,
    price: {
      min: payload.priceAm,
      max: payload.pricePm,
    },
    capacity: payload.capacity ?? null,
    surface: payload.surface ?? "",
    openingTime: payload.openingTime ?? "",
    closingTime: payload.closingTime ?? "",
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
  }
}

function buildPartialFieldPayload(payload: Partial<FieldMutationPayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {}

  if (payload.name !== undefined) body.name = payload.name
  if (payload.city !== undefined) body.city = payload.city
  if (payload.village !== undefined) body.village = payload.village
  if (payload.address !== undefined) body.address = payload.address
  if (payload.governorate !== undefined) body.governorate = payload.governorate
  if (payload.type !== undefined) body.type = payload.type
  if (payload.photos !== undefined) body.photos = payload.photos
  if (payload.amenities !== undefined) body.amenities = payload.amenities
  if (payload.priceAm !== undefined) body.priceAm = payload.priceAm
  if (payload.pricePm !== undefined) body.pricePm = payload.pricePm
  if (payload.priceAm !== undefined || payload.pricePm !== undefined) {
    body.price = {
      min: payload.priceAm ?? 0,
      max: payload.pricePm ?? payload.priceAm ?? 0,
    }
  }
  if (payload.capacity !== undefined) body.capacity = payload.capacity
  if (payload.surface !== undefined) body.surface = payload.surface
  if (payload.openingTime !== undefined) body.openingTime = payload.openingTime
  if (payload.closingTime !== undefined) body.closingTime = payload.closingTime
  if (payload.latitude !== undefined) body.latitude = payload.latitude
  if (payload.longitude !== undefined) body.longitude = payload.longitude

  return body
}

async function getList(url: string): Promise<FieldRecord[]> {
  const response = await http<FieldApiListResponse | HttpStatusPayload>(url)

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return []
  }

  return normalizeFieldListResponse(response).map(mapFieldDtoToRecord)
}

async function getSingle(url: string): Promise<FieldRecord | null> {
  const response = await http<FieldApiDto | HttpStatusPayload>(url)

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return null
  }

  const item = normalizeFieldResponse(response)
  return item ? mapFieldDtoToRecord(item) : null
}

export async function getFields(params?: {
  search?: string
  limit?: number
}): Promise<FieldRecord[]> {
  const searchParams = new URLSearchParams()

  if (params?.search) {
    searchParams.set("search", params.search)
  }

  if (params?.limit) {
    searchParams.set("limit", String(params.limit))
  }

  const url = `/api/fields${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
  return getList(url)
}

export async function getPopularFields(limit = 3): Promise<FieldRecord[]> {
  return getList(`/api/fields/popular?limit=${encodeURIComponent(String(limit))}`)
}

export async function searchFields(query: string): Promise<FieldRecord[]> {
  if (!query.trim()) {
    return []
  }

  return getList(`/api/fields/search?query=${encodeURIComponent(query.trim())}`)
}

export async function getFieldById(id: string | number): Promise<FieldRecord | null> {
  return getSingle(`/api/fields/${encodeURIComponent(String(id))}`)
}

export async function createField(
  payload: FieldMutationPayload,
): Promise<FieldMutationResult<FieldRecord>> {
  const response = await http<FieldApiDto | HttpStatusPayload>("/api/fields", {
    method: "POST",
    body: JSON.stringify(buildFieldPayload(payload)),
  })

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult<FieldRecord>(null, response.status, getStatusMessage(response))
  }

  const item = normalizeFieldResponse(response)
  return buildMutationResult(item ? mapFieldDtoToRecord(item) : null, null, null)
}

export async function updateField(
  id: string | number,
  payload: Partial<FieldMutationPayload>,
): Promise<FieldMutationResult<FieldRecord>> {
  const response = await http<FieldApiDto | HttpStatusPayload>(
    `/api/fields/${encodeURIComponent(String(id))}`,
    {
      method: "PUT",
      body: JSON.stringify(buildPartialFieldPayload(payload)),
    },
  )

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult<FieldRecord>(null, response.status, getStatusMessage(response))
  }

  const item = normalizeFieldResponse(response)
  return buildMutationResult(item ? mapFieldDtoToRecord(item) : null, null, null)
}

export async function deleteField(
  id: string | number,
): Promise<FieldMutationResult<null>> {
  const response = await http<unknown | HttpStatusPayload>(
    `/api/fields/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    },
  )

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult(null, response.status, getStatusMessage(response))
  }

  return buildMutationResult(null, null, null)
}

export async function getOwnerFields(ownerId: string | number): Promise<FieldRecord[]> {
  return getList(`/api/fields/owner/${encodeURIComponent(String(ownerId))}`)
}

export async function getPendingFields(): Promise<FieldRecord[]> {
  return getList("/api/fields/pending")
}

export async function approveField(payload: {
  fieldId: string | number
  isApproved: boolean
  rejectionReason?: string
}): Promise<FieldMutationResult<null>> {
  const response = await http<unknown | HttpStatusPayload>("/api/fields/approve", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (isHttpStatusPayload(response) && response.status && response.status >= 400) {
    return buildMutationResult(null, response.status, getStatusMessage(response))
  }

  return buildMutationResult(null, null, null)
}