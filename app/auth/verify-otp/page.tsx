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
  const [otp, setOtp] = useState(Array(6).fill(""))
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

  const otpString = otp.join("")
  const canVerify = isOtpValid(otpString) && !isLoading && isLoaded && !!email

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (e: any, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!isOtpValid(otpString)) {
      setError(t("auth.invalidOtp"))
      return
    }

    setIsLoading(true)

    try {
      if (purpose === "register") {
        await verifyRegisterOtp({
          email,
          otpCode: otpString,
          accountType,
        })

        sessionStorage.removeItem(PENDING_REGISTER_KEY)
        router.push(getSignInRoute(accountType))
        return
      }

      await verifyPasswordResetOtp({
        email,
        otpCode: otpString,
      })

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
          <AppLogo showTagline />
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.verifyOtpTitle")}</CardTitle>
            <CardDescription>{t("auth.verifyOtpDescription")}</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 text-sm text-red-500">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="flex justify-center" dir="ltr">
                <div className="grid grid-cols-6 gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      maxLength={1}
                      className="
                        h-12 w-12
                        md:h-14 md:w-14
                        text-center text-xl font-bold
                        rounded-xl border border-green-300
                        focus:border-green-600 focus:ring-2 focus:ring-green-600/20
                      "
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={!canVerify} className="w-full">
                {isLoading ? t("auth.verifying") : t("auth.verifyCode")}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpPageContent />
    </Suspense>
  )
}