  import { useAuthSessionStore } from "@/lib/auth-session-store"
  import { useUserStore } from "@/lib/user-store"
  import type { UserProfile } from "@/lib/types/user"
  import { http } from "@/lib/API/http-client"
  import type {
    AuthSession,
    SignInRequestPayload,
    RegisterPlayerRequestPayload,
    RegisterPlayerResponse,
    LoginApiRequest,
    PlayerRegisterApiRequest,
    OwnerRegisterApiRequest,
    VerifyOtpApiRequest,
    ForgotPasswordApiRequest,
    ResetPasswordApiRequest,
    AuthApiResponse,
  } from "@/lib/types/auth"

  /** Stable id for API mapping until real auth issues JWT-backed user ids. */
  export const PLACEHOLDER_AUTH_USER_ID = "demo-user-1"

  function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  function deriveDisplayNameFromEmail(email?: string) {
    if (!email) return "Player"
    const handle = email.split("@")[0]?.trim()
    if (!handle) return "Player"
    return handle
      .split(/[._-]/g)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }

  function buildSession(
    accountType: "player" | "owner",
    userId?: string,
    roles?: AuthSession["roles"],
  ): AuthSession {
    const fallbackRoles: AuthSession["roles"] =
      accountType === "owner" ? ["owner"] : ["player"]

    return {
      userId: userId ?? PLACEHOLDER_AUTH_USER_ID,
      accountType,
      roles: roles && roles.length > 0 ? roles : fallbackRoles,
    }
  }

  function extractToken(response: unknown): string | undefined {
    if (!response || typeof response !== "object") return undefined

    const payload = response as Record<string, unknown>
    return (
      (payload.data as any)?.token ||
      (payload.data as any)?.accessToken ||
      payload.token ||
      payload.accessToken
    ) as string | undefined
  }

  function extractUserData(response: unknown): Record<string, unknown> | null {
    if (!response || typeof response !== "object") return null

    const payload = response as Record<string, unknown>
    const outerData = payload.data as Record<string, unknown> | undefined
    const candidate = outerData ?? payload

    if (typeof candidate !== "object" || candidate === null) return null

    return (
      (candidate.user as Record<string, unknown>) ||
      (candidate.account as Record<string, unknown>) ||
      (candidate.userInfo as Record<string, unknown>) ||
      (candidate.profile as Record<string, unknown>) ||
      candidate
    )
  }

  function extractAccountType(response: unknown): "player" | "owner" | undefined {
    const candidate = extractUserData(response)
    if (!candidate) return undefined

    const rawType =
      candidate.accountType ||
      candidate.role ||
      candidate.userType ||
      candidate.type ||
      candidate.userRole ||
      candidate.account_type

    const normalize = (value: unknown) => String(value || "").toLowerCase()

    if (typeof rawType === "string") {
      const normalized = normalize(rawType)
      if (normalized.includes("owner")) return "owner"
      if (normalized.includes("player")) return "player"
    }

    const roles = candidate.roles as unknown
    if (Array.isArray(roles)) {
      const normalizedRoles = roles.map((role) => normalize(role))
      if (normalizedRoles.includes("owner")) return "owner"
      if (normalizedRoles.includes("player")) return "player"
    }

    return undefined
  }

  function extractRoles(response: unknown, accountType: "player" | "owner"): AuthSession["roles"] {
    const candidate = extractUserData(response)
    const fallbackRoles: AuthSession["roles"] =
      accountType === "owner" ? ["owner"] : ["player"]

    if (!candidate) {
      return fallbackRoles
    }

    const normalizeRole = (value: unknown): AuthSession["roles"][number] | null => {
      const normalized = String(value || "").trim().toLowerCase()

      if (normalized === "player" || normalized === "owner" || normalized === "admin") {
        return normalized
      }

      return null
    }

    const rolesSource = Array.isArray(candidate.roles)
      ? candidate.roles
      : [candidate.role, candidate.accountType, candidate.userRole]

    const roles = rolesSource
      .map(normalizeRole)
      .filter((role): role is AuthSession["roles"][number] => role !== null)

    return roles.length > 0 ? Array.from(new Set(roles)) : fallbackRoles
  }

  async function postToApi<TBody, TResponse = AuthApiResponse>(
    path: string,
    body: TBody,
  ): Promise<TResponse | string> {
    return http<TResponse | string>(path, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  export async function sendPasswordResetOtp(payload: ForgotPasswordApiRequest): Promise<void> {
    await postToApi<ForgotPasswordApiRequest, AuthApiResponse>("/api/auth/forgot-password", payload)
  }

  export async function sendForgotPasswordOtp(payload: ForgotPasswordApiRequest): Promise<void> {
    return sendPasswordResetOtp(payload)
  }

  export async function verifyPasswordResetOtp(payload: VerifyOtpApiRequest): Promise<void> {
    await postToApi<VerifyOtpApiRequest, AuthApiResponse>("/api/auth/verify-otp", payload)
  }

  export async function verifyRegisterOtp(
    payload: VerifyOtpApiRequest & { accountType: "player" | "owner" },
  ): Promise<void> {
    await postToApi<VerifyOtpApiRequest & { accountType: "player" | "owner" }, AuthApiResponse>(
      "/api/auth/verify-otp",
      payload,
    )
  }

  export async function resetPassword(payload: ResetPasswordApiRequest): Promise<void> {
    await postToApi<ResetPasswordApiRequest, AuthApiResponse>(
      "/api/auth/reset-password",
      payload,
    )
  }

  export async function signIn(payload: SignInRequestPayload): Promise<AuthSession> {
    const request = {
      password: payload.password,
      email: normalizeEmail(payload.email ?? ""),
      accountType: payload.accountType === "owner" ? "Owner" : "Player",
    } as unknown as LoginApiRequest

    const res = await postToApi<LoginApiRequest, AuthApiResponse>("/api/auth/login", request)

    const actualAccountType = extractAccountType(res)
    if (actualAccountType && actualAccountType !== payload.accountType) {
      throw new Error(
        payload.accountType === "player"
          ? "WRONG_ACCOUNT_TYPE_PLAYER"
          : "WRONG_ACCOUNT_TYPE_OWNER",
      )
    }

    const token = extractToken(res)
    if (!token) {
      throw new Error("Authentication failed: missing token")
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("token", token)
    }

    const userData = extractUserData(res)
    const email = (userData?.email as string) || normalizeEmail(payload.email ?? "")
    const fallbackName =
      payload.accountType === "owner" ? "Owner Account" : deriveDisplayNameFromEmail(email)

    useUserStore.getState().updateUser({
      email,
      fullName:
        (userData?.fullName as string) ||
        (userData?.name as string) ||
        `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim() ||
        fallbackName,

      username:
        (userData?.username as string) ||
        (userData?.userName as string) ||
        fallbackName.toLowerCase().replace(/\s+/g, "_"),

      phoneNumber: (userData?.phone as string) || "",

      age: userData?.age as number,
      gender: userData?.gender as string,
      address:
        (userData?.address as string) ||
        (userData?.playgroundAddress as string) ||
        "",

      joinedAt: userData?.joinedAt as string,

      position: (userData?.position as string) || "",
    })

    const userId =
      (userData?.id as string) ||
      (userData?.userId as string) ||
      (userData?._id as string) ||
      PLACEHOLDER_AUTH_USER_ID

    const session = buildSession(payload.accountType, userId, extractRoles(res, payload.accountType))
    useAuthSessionStore.getState().setSession(session)

    return session
  }

  export async function registerPlayer(
    payload: RegisterPlayerRequestPayload,
  ): Promise<RegisterPlayerResponse> {
    const request: PlayerRegisterApiRequest = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      username: payload.username.trim(),
      email: normalizeEmail(payload.email),
      phone: payload.phone.trim(),
      password: payload.password,

      age: payload.age,
      gender: payload.gender,
      address: payload.address,
      joinedAt: payload.joinedAt,

      position: payload.position ?? null,
      skillLevel: payload.skillLevel,
    }

    const response = await postToApi<PlayerRegisterApiRequest, AuthApiResponse<string>>(
      "/api/auth/register/player",
      request,
    )

    if (typeof response === "string") return response

    return response.data ?? response.message ?? "تم إنشاء الحساب. تحقق من بريدك الإلكتروني."
  }

  export async function registerOwner(
    payload: OwnerRegisterApiRequest,
  ): Promise<string> {
   const request = {
  firstName: payload.firstName?.trim(),
  lastName: payload.lastName?.trim(),
  email: normalizeEmail(payload.email),
  phone: payload.phone?.trim(),
  password: payload.password,

  username:
    payload.username?.trim() ||
    normalizeEmail(payload.email).split("@")[0],

  playgroundAddress:
    payload.playgroundAddress?.trim() || "Not provided",

  photoUrl:
    payload.photoUrl?.trim() || "https://placehold.co/100",

  businessLicenseUrl:
    payload.businessLicenseUrl?.trim() || "https://placehold.co/300x200",
}
    const response = await postToApi<typeof request, AuthApiResponse<string>>(
      "/api/auth/register/owner",
      request,
    )

    if (typeof response === "string") return response

    return response.data ?? response.message ?? ""
  }

  export async function signOut(): Promise<void> {
    useAuthSessionStore.getState().clearSession()
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
    }
  }

  function profileFromStore(): UserProfile {
    const u = useUserStore.getState().user
    return {
      id: PLACEHOLDER_AUTH_USER_ID,
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      phoneNumber: u.phoneNumber,
      position: u.position,
      points: u.points,
      avatarUrl: u.avatar || null,

      age: u.age,
      gender: u.gender,
      address: u.address,
      joinedAt: u.joinedAt,
    }
  }

  export async function getCurrentUserProfile(): Promise<UserProfile> {
    return profileFromStore()
  }

  export async function updateCurrentUserProfile(
    patch: Partial<
      Pick<UserProfile, "fullName" | "username" | "email" | "phoneNumber" | "position" | "avatarUrl">
    >,
  ): Promise<UserProfile> {
    useUserStore.getState().updateUser({
      fullName: patch.fullName,
      username: patch.username,
      email: patch.email,
      phoneNumber: patch.phoneNumber,
      position: patch.position,
      avatar: patch.avatarUrl ?? undefined,
    })

    return profileFromStore()
  }
