const BASE_URL = process.env.NEXT_PUBLIC_API_URL

type ApiErrorShape = {
  message?: unknown
  error?: unknown
  errors?: unknown
  isSuccess?: boolean
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

export async function http<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured")
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = new Headers(options.headers || undefined)

  headers.set("Content-Type", "application/json")

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

  if (!res.ok) {
    const message = getErrorMessage(data, res.statusText || `API Error (${res.status})`)
    console.error(`[HTTP] Error response (${res.status}):`, message)
    throw new Error(message)
  }

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

  return data as T
}