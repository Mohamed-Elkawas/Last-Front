const BASE_URL = process.env.NEXT_PUBLIC_API_URL
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

type ApiErrorShape = {
  message?: unknown
  error?: unknown
  errors?: unknown
  isSuccess?: boolean
}

async function mockHandler<T>(url: string, options: RequestInit = {}): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  // ================= AUTH =================
  if (url.includes("/auth/register/player") || url.includes("/api/auth/register/player")) {
    return {
      isSuccess: true,
      message: "Mock player registered",
      data: null,
      errors: null,
    } as T
  }

  if (url.includes("/auth/register/owner") || url.includes("/api/auth/register/owner")) {
    return {
      isSuccess: true,
      message: "Mock owner registered",
      data: null,
      errors: null,
    } as T
  }

  if (url.includes("/auth/login") || url.includes("/api/auth/login")) {
    const body = typeof options.body === "string" ? JSON.parse(options.body) : {}
    const isOwner = body?.accountType === "owner" || body?.accountType === "Owner"

    return {
      isSuccess: true,
      message: "Mock login success",
      data: {
        token: "mock-token",
        user: {
          id: 1,
          firstName: isOwner ? "Owner" : "Player",
          lastName: "Mock",
          username: isOwner ? "owner_mock" : "player_mock",
          email: isOwner ? "owner@test.com" : "player@test.com",
          phone: "01000000000",
          role: isOwner ? "owner" : "player",
          accountType: isOwner ? "owner" : "player",
        },
      },
      errors: null,
    } as T
  }

  if (url.includes("/auth/verify-otp") || url.includes("/api/auth/verify-otp")) {
    return {
      isSuccess: true,
      message: "Mock OTP verified",
      data: null,
      errors: null,
    } as T
  }

  if (url.includes("/auth/forgot-password") || url.includes("/api/auth/forgot-password")) {
    return {
      isSuccess: true,
      message: "Mock OTP sent",
      data: null,
      errors: null,
    } as T
  }

  if (url.includes("/auth/reset-password") || url.includes("/api/auth/reset-password")) {
    return {
      isSuccess: true,
      message: "Mock password reset",
      data: null,
      errors: null,
    } as T
  }

  // ================= NOTIFICATIONS =================
  if (url === "/notifications" || url === "/api/notifications") {
    return {
      isSuccess: true,
      message: null,
      data: [],
      errors: null,
    } as T
  }

  if (url.includes("/notifications/") && url.includes("/read")) {
    return {
      isSuccess: true,
      message: "Mock notification marked as read",
      data: null,
      errors: null,
    } as T
  }

  if (url === "/notifications/read-all" || url === "/api/notifications/read-all") {
    return {
      isSuccess: true,
      message: "Mock all notifications marked as read",
      data: null,
      errors: null,
    } as T
  }

  // ================= POINTS =================
  if (url === "/api/points/me" || url === "/points/me") {
    return {
      isSuccess: true,
      message: null,
      data: {
        points: 0,
        totalPoints: 0,
        level: 1,
        rank: "Beginner",
      },
      errors: null,
    } as T
  }

 // ================= FIELDS =================
const mockFields: any[] =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("mock_fields") || "[]")
    : []

if (url.includes("/api/fields")) {
  const body = typeof options.body === "string" ? JSON.parse(options.body) : {}

  if (options.method === "POST" && url === "/api/fields") {
    const newField = {
      id: Date.now(),
      ownerId: 1,
      name: body.name,
      city: body.city,
      village: body.village,
      address: body.address,
      governorate: body.governorate,
      type: body.type,
      photos: body.photos,
      priceAm: body.priceAm,
      pricePm: body.pricePm,
      amenities: body.amenities ?? [],
      status: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const nextFields = [...mockFields, newField]

    if (typeof window !== "undefined") {
      localStorage.setItem("mock_fields", JSON.stringify(nextFields))
    }

    return {
      isSuccess: true,
      message: "Mock field created",
      data: newField,
      errors: null,
    } as T
  }

  if (url.includes("/api/fields/popular")) {
    return {
      isSuccess: true,
      message: null,
      data: mockFields.slice(0, 3),
      errors: null,
    } as T
  }

  if (url.includes("/api/fields/search")) {
    return {
      isSuccess: true,
      message: null,
      data: mockFields,
      errors: null,
    } as T
  }

  if (url.includes("/api/fields/pending")) {
    return {
      isSuccess: true,
      message: null,
      data: mockFields.filter((field) => field.status === "pending"),
      errors: null,
    } as T
  }

  if (url.includes("/api/fields/owner/")) {
    return {
      isSuccess: true,
      message: null,
      data: mockFields,
      errors: null,
    } as T
  }

  if (/\/api\/fields\/[^\/]+$/.test(url)) {
    const id = url.split("/").pop()
    const field = mockFields.find((item) => String(item.id) === String(id))

    return {
      isSuccess: true,
      message: null,
      data: field ?? null,
      errors: null,
    } as T
  }

  return {
    isSuccess: true,
    message: null,
    data: mockFields,
    errors: null,
  } as T
}

 // ================= PLAYGROUNDS =================
if (url.includes("/playgrounds") || url.includes("/api/playgrounds")) {
  const mockFields =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("mock_fields") || "[]")
      : []

  return {
    isSuccess: true,
    message: null,
    data: mockFields.map((field: any) => ({
      id: String(field.id),
      name: { en: field.name, ar: field.name },
      address: {
        en: [field.address, field.city].filter(Boolean).join(", "),
        ar: [field.address, field.city].filter(Boolean).join(", "),
      },
      pricePerHour: Number(field.pricePm || field.priceAm || 0),
      rating: 4.8,
      imageUrl: Array.isArray(field.photos)
        ? field.photos[0]
        : field.photos || "/placeholder.jpg",
      slots: [
        { startTime: "18:00", endTime: "19:00", slotKey: "18-19" },
        { startTime: "19:00", endTime: "20:00", slotKey: "19-20" },
        { startTime: "20:00", endTime: "21:00", slotKey: "20-21" },
      ],
    })),
    errors: null,
  } as T
}
  // ================= BOOKINGS =================
  if (
    options.method === "POST" &&
    (url.includes("/bookings") || url.includes("/api/bookings"))
  ) {
    return {
      isSuccess: true,
      message: "Mock booking created",
      data: {
        id: `booking-${Date.now()}`,
        status: "pending_payment",
        paymentStatus: "pending",
      },
      errors: null,
    } as T
  }

  if (
    options.method === "PATCH" &&
    (url.includes("/bookings") || url.includes("/api/bookings"))
  ) {
    return {
      isSuccess: true,
      message: "Mock booking updated",
      data: null,
      errors: null,
    } as T
  }

  if (url.includes("/bookings") || url.includes("/api/bookings")) {
    return {
      isSuccess: true,
      message: null,
      data: [
        {
          id: "booking-1",
          status: "pending_payment",
          paymentStatus: "pending",
          date: "2026-05-01",
          playground: {
            id: "pg-1",
            name: { en: "El Geish Stadium", ar: "ملعب الجيش" },
          },
          slots: [{ startTime: "18:00", endTime: "19:00", slotKey: "18-19" }],
          totalPrice: 250,
        },
        {
          id: "booking-2",
          status: "confirmed",
          paymentStatus: "paid",
          date: "2026-05-02",
          playground: {
            id: "pg-2",
            name: { en: "Smart Arena", ar: "سمارت أرينا" },
          },
          slots: [{ startTime: "20:00", endTime: "21:00", slotKey: "20-21" }],
          totalPrice: 300,
        },
      ],
      errors: null,
    } as T
  }

  // ================= TOURNAMENTS =================
const mockTournaments: any[] =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("mock_tournaments") || "[]")
    : []

if (url.includes("/tournaments") || url.includes("/api/tournaments")) {
  const body = typeof options.body === "string" ? JSON.parse(options.body) : {}

  if (options.method === "POST" && (url === "/api/tournaments" || url === "/tournaments")) {
    const newTournament = {
      id: Date.now(),
      ownerId: 1,
      fieldId: body.fieldId ?? null,
      name: body.name,
      numberOfTeams: body.numberOfTeams,
      teamsJoined: 0,
      prize: body.prize,
      description: body.description,
      price: body.price,
      type: body.type,
      status: "open",
      startDate: body.startDate,
      endDate: body.endDate,
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const nextTournaments = [...mockTournaments, newTournament]

    if (typeof window !== "undefined") {
      localStorage.setItem("mock_tournaments", JSON.stringify(nextTournaments))
    }

    return {
      isSuccess: true,
      message: "Mock tournament created",
      data: newTournament,
      errors: null,
    } as T
  }

  if (options.method === "DELETE") {
    const id = url.split("/").pop()

    const nextTournaments = mockTournaments.filter(
      (item) => String(item.id) !== String(id),
    )

    if (typeof window !== "undefined") {
      localStorage.setItem("mock_tournaments", JSON.stringify(nextTournaments))
    }

    return {
      isSuccess: true,
      message: "Mock tournament deleted",
      data: null,
      errors: null,
    } as T
  }

  if (url.includes("/api/tournaments/upcoming") || url.includes("/tournaments/upcoming")) {
    return {
      isSuccess: true,
      message: null,
      data: mockTournaments.slice(0, 2),
      errors: null,
    } as T
  }

  if (/\/api\/tournaments\/[^\/]+$/.test(url) || /\/tournaments\/[^\/]+$/.test(url)) {
    const id = url.split("/").pop()

    const tournament = mockTournaments.find(
      (item) => String(item.id) === String(id),
    )

    return {
      isSuccess: true,
      message: null,
      data: tournament ?? null,
      errors: null,
    } as T
  }

  return {
    isSuccess: true,
    message: null,
    data: mockTournaments,
    errors: null,
  } as T
}

  console.warn(`[MOCK MODE] Missing mock for: ${url}`)

  return {
    isSuccess: true,
    message: null,
    data: null,
    errors: null,
  } as T
}

function parseApiResponse(text: string): unknown {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "string") return data

  if (typeof data === "object" && data !== null) {
    const apiError = data as ApiErrorShape

    if (typeof apiError.message === "string") return apiError.message
    if (typeof apiError.error === "string") return apiError.error

    if (apiError.errors) {
      return JSON.stringify(apiError.errors)
    }
  }

  return fallback
}
function normalizeResponse<T>(data: unknown): T {
  const safeData =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {}

  return {
    status: safeData.status ?? (safeData.isSuccess === false ? 400 : 200),
    message: safeData.message ?? null,
    result: safeData.result ?? safeData.data ?? null,
    errors: safeData.errors ?? null,
  } as T
}

export async function http<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (USE_MOCK || BASE_URL === "mock") {
    console.log("[MOCK MODE]", url)
    return mockHandler<T>(url, options)
  }

  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured")
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = new Headers(options.headers || undefined)

  headers.set("Content-Type", "application/json")
  headers.set("ngrok-skip-browser-warning", "true")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const fullUrl = `${BASE_URL}${url}`
  const method = options.method || "GET"

  console.log(`[HTTP] ${method} ${fullUrl}`, {
    body: typeof options.body === "string" ? parseApiResponse(options.body) : null,
  })

  let res: Response

  try {
    res = await fetch(fullUrl, {
      ...options,
      headers,
    })
  } catch (fetchErr) {
    console.error(`[HTTP] Fetch failed for ${method} ${fullUrl}:`, fetchErr)
    throw new Error("تعذر الاتصال بالخادم. تحقق من رابط API أو إعدادات CORS.")
  }

  const text = await res.text()
  const data = parseApiResponse(text)

  console.log(`[HTTP] Response ${res.status} from ${method} ${fullUrl}:`, {
    statusText: res.statusText,
    data,
  })

  // Handle 4xx responses silently (except for isSuccess: false check)
  if (!res.ok) {
    if (res.status === 404) {
      return {
        data: null,
        status: 404,
        statusText: res.statusText,
        message: getErrorMessage(data, res.statusText || "Not Found"),
        errors: typeof data === "object" && data !== null ? (data as ApiErrorShape).errors : null,
      } as T
    }

    if (res.status >= 500) {
      // Throw for server errors (5xx)
      const message = getErrorMessage(data, res.statusText || `API Error (${res.status})`)
      console.error(`[HTTP] Error response (${res.status}):`, message)
      throw new Error(message)
    }

    return {
      data: null,
      status: res.status,
      statusText: res.statusText,
      message: getErrorMessage(data, res.statusText || `API Error (${res.status})`),
      errors: typeof data === "object" && data !== null ? (data as ApiErrorShape).errors : null,
    } as T
  }

  // Check API-level error (isSuccess: false in response body)
  if (
    typeof data === "object" &&
    data !== null &&
    "isSuccess" in data &&
    (data as ApiErrorShape).isSuccess === false
  ) {
    const message = getErrorMessage(data, `API Error (${res.status})`)
    console.error("[HTTP] isSuccess=false:", message)
    throw new Error(message)
  }

 return normalizeResponse<T>(data)
}
