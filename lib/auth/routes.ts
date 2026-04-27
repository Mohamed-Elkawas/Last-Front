export type AuthAccountType = "player" | "owner"

export const AUTH_ROUTES = {
  signIn: {
    player: "/auth/signin/player",
    owner: "/auth/signin/owner",
  },
  signUp: {
    player: "/auth/signup/player",
    owner: "/auth/signup/owner",
  },
  forgotPassword: "/auth/forgot-password",
  verifyOtp: "/auth/verify-otp",
  resetPassword: "/auth/reset-password",
  playerHome: "/",
  ownerHome: "/owner/dashboard",
  ownerRegister: "/auth/owner-register",
} as const

export function getSignInRoute(accountType: AuthAccountType): string {
  return AUTH_ROUTES.signIn[accountType]
}



export function getSignUpRoute(accountType: AuthAccountType): string {
  return AUTH_ROUTES.signUp[accountType]
}

export function getForgotPasswordRoute(): string {
  return AUTH_ROUTES.forgotPassword
}

export function getVerifyOtpRoute(): string {
  return AUTH_ROUTES.verifyOtp
}

export function getResetPasswordRoute(): string {
  return AUTH_ROUTES.resetPassword
}

export function getPostLoginRoute(accountType: AuthAccountType): string {
  return accountType === "owner" ? AUTH_ROUTES.ownerHome : AUTH_ROUTES.playerHome
}
