"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Mail } from "lucide-react"

import { AppLogo } from "@/components/ui/app-logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useTranslate } from "@/hooks/use-translate"
import { verifyPasswordResetOtp, verifyRegisterOtp } from "@/lib/services/auth.service"
import { AUTH_ROUTES, getSignInRoute } from "@/lib/auth/routes"

const PENDING_REGISTER_KEY = "hagzaya-auth-pending-verification"
const PENDING_RESET_KEY = "hagzaya-auth-pending-reset"

type AccountType = "player" | "owner"
type OtpPurpose = "register" | "reset"

type PendingOtpData = {
  email: string
  accountType?: AccountType
  purpose?: OtpPurpose
}

function isOtpValid(value: string) {
  return /^[0-9]{6}$/.test(value)
}

function readPendingData(purpose: OtpPurpose): PendingOtpData | null {
  if (typeof window === "undefined") return null

  const storageKey = purpose === "reset" ? PENDING_RESET_KEY : PENDING_REGISTER_KEY
  const raw = sessionStorage.getItem(storageKey)

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PendingOtpData

    if (!parsed?.email) return null

    return parsed
  } catch {
    return null
  }
}

function VerifyOtpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, isArabic } = useTranslate()

  const [email, setEmail] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("player")
  const [purpose, setPurpose] = useState<OtpPurpose>("register")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const backHref = useMemo(() => {
    return purpose === "reset" ? AUTH_ROUTES.forgotPassword : getSignInRoute(accountType)
  }, [accountType, purpose])

  useEffect(() => {
    const queryPurpose = searchParams.get("purpose") === "reset" ? "reset" : "register"
    const queryType = searchParams.get("type") === "owner" ? "owner" : "player"

    setPurpose(queryPurpose)
    setAccountType(queryType)

    const pending = readPendingData(queryPurpose)

    if (!pending) {
      setError(t("auth.pendingVerificationMissing"))
      setIsLoaded(true)
      return
    }

    setEmail(pending.email)
    setAccountType(pending.accountType ?? queryType)
    setPurpose(pending.purpose ?? queryPurpose)
    setIsLoaded(true)
  }, [searchParams, t])

  const canVerify = isOtpValid(otp) && !isLoading && isLoaded && !!email

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email) {
      setError(t("auth.pendingVerificationMissing"))
      return
    }

    if (!isOtpValid(otp)) {
      setError(t("auth.invalidOtp"))
      return
    }

    setIsLoading(true)

    try {
      if (purpose === "register") {
        await verifyRegisterOtp({
          email,
          otpCode: otp,
          accountType,
        })

        sessionStorage.removeItem(PENDING_REGISTER_KEY)
        router.push(getSignInRoute(accountType))
        return
      }

      await verifyPasswordResetOtp({
        email,
        otpCode: otp,
      })

      sessionStorage.setItem(
        PENDING_RESET_KEY,
        JSON.stringify({
          email,
          otpCode: otp,
          accountType,
          purpose: "reset",
        }),
      )

      router.push(AUTH_ROUTES.resetPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex">
            <AppLogo showTagline />
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {purpose === "reset"
                ? t("auth.verifyResetOtpTitle")
                : t("auth.verifyOtpTitle")}
            </CardTitle>

            <CardDescription>
              {purpose === "reset"
                ? t("auth.verifyResetOtpDescription")
                : t("auth.verifyOtpDescription")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {!email && isLoaded ? (
              <div className="space-y-4">
                <Button className="w-full" asChild>
                  <Link href={purpose === "reset" ? AUTH_ROUTES.forgotPassword : getSignInRoute(accountType)}>
                    {purpose === "reset"
                      ? t("auth.backToForgotPassword")
                      : t("auth.backToSignIn")}
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-base font-bold text-green-800 shadow-sm">
                  <Mail className="h-5 w-5 text-green-600" />
                  <span className="truncate">{email}</span>
                </div>

                <div className="space-y-2">
                  <p className="mt-4 text-center text-base font-bold text-foreground">
                    {t("auth.verificationCode")}
                  </p>

                  <p className="mb-2 text-center text-sm text-muted-foreground">
                    {t("auth.enterSixDigitCode")}
                  </p>

                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    className="flex justify-center"
                  >
                    <InputOTPGroup
                      className="flex justify-center gap-2 sm:gap-3 px-2"
                      dir="ltr"
                    >
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="
          h-10 w-10
          sm:h-12 sm:w-12
          md:h-14 md:w-14
          rounded-xl border border-green-300
          text-center text-base sm:text-lg md:text-xl
          font-bold shadow-sm
          focus:border-green-600 focus:ring-2 focus:ring-green-600/20
        "
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-green-600 text-base font-bold text-white hover:bg-green-700"
                  disabled={!canVerify}
                >
                  {isLoading ? t("auth.verifying") : t("auth.verifyCode")}
                </Button>

                <div className="text-center">
                  <Link
                    href={backHref}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ArrowLeft className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                    {purpose === "reset"
                      ? t("auth.backToForgotPassword")
                      : t("auth.backToSignIn")}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function VerifyOtpFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpFallback />}>
      <VerifyOtpPageContent />
    </Suspense>
  )
}