import type { EntityId } from "@/lib/types/common"

export type UserRole = "player" | "owner" | "admin"

/** Session shape expected from a future auth API (tokens omitted until backend exists). */
export type AuthSession = {
  userId: EntityId
  accountType: "player" | "owner"
  roles: UserRole[]
}

export type SignInRequestPayload = {
  email?: string
  phone?: string
  password: string
  accountType: "player" | "owner"
}

export type SignUpRequestPayload = {
  email: string
  password: string
  fullName: string
  accountType: "player" | "owner"
}

export type LoginApiRequest = {
  email?: string | null
  phone?: string | null
  password: string
  accountType?: "player" | "owner"
}

export type PlayerRegisterApiRequest = {
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
  password: string

  age?: number
  gender?: string
  address?: string
  joinedAt?: string

  position?: string | null
  skillLevel: number
}

export type OwnerRegisterApiRequest = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  username: string

  age?: number
  gender?: string

  playgroundAddress?: string | null
  photoUrl?: string | null
  businessLicenseUrl: string
}

export type VerifyOtpApiRequest = {
  email: string
  otpCode: string
}
export type VerifyRegisterOtpApiRequest = VerifyOtpApiRequest & {
  accountType: "player" | "owner"
}

export type ForgotPasswordApiRequest = {
  email: string
}

export type ResetPasswordApiRequest = {
  email: string
  otpCode: string
  newPassword: string
  confirmPassword: string
}

export type AuthApiResponse<TData = unknown> = {
  data?: TData
  token?: string
  accessToken?: string
  message?: string
  isSuccess?: boolean
  [key: string]: unknown
}

export type SendPasswordResetOtpRequestPayload = ForgotPasswordApiRequest
export type VerifyPasswordResetOtpRequestPayload = VerifyOtpApiRequest
export type ResetPasswordRequestPayload = ResetPasswordApiRequest

export type RegisterPlayerRequestPayload = PlayerRegisterApiRequest
export type RegisterPlayerResponse = string
