"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AppLogo } from "@/components/ui/app-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import Link from "next/link"
import { useTranslate } from "@/hooks/use-translate"
import { verifyPasswordResetOtp, verifyRegisterOtp } from "@/lib/services/auth.service"
import { AUTH_ROUTES, getSignInRoute } from "@/lib/auth/routes"

const PENDING_VERIFICATION_KEY = "hagzaya-auth-pending-verification"
const PENDING_RESET_KEY = "hagzaya-auth-pending-reset"

function isOtpValid(value: string) {
  return /^[0-9]{6}$/.test(value)
}

function VerifyOtpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, isArabic } = useTranslate()

  const [email, setEmail] = useState("")
  const [accountType, setAccountType] = useState<"player" | "owner">("player")
  const [purpose, setPurpose] = useState<"register" | "reset">("register")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const queryPurpose = searchParams.get("purpose")
    const queryType = searchParams.get("type")
    const pendingRaw = sessionStorage.getItem(PENDING_VERIFICATION_KEY)

    if (queryPurpose === "reset") {
      setPurpose("reset")
    } else {
      setPurpose("register")
    }

    if (queryType === "owner") {
      setAccountType("owner")
    } else {
      setAccountType("player")
    }

    if (!pendingRaw) {
      setError(t("auth.pendingVerificationMissing") || "لا توجد بيانات للتحقق")
      setIsLoaded(true)
      return
    }

    try {
      const pending = JSON.parse(pendingRaw) as {
        email: string
        accountType?: "player" | "owner"
        purpose?: "register" | "reset"
      }

      if (!pending?.email) {
        throw new Error("Missing pending email")
      }

      setEmail(pending.email)
      if (pending.accountType) {
        setAccountType(pending.accountType)
      }
      if (pending.purpose === "reset") {
        setPurpose("reset")
      }
    } catch {
      setError(t("auth.pendingVerificationInvalid") || "تعذر قراءة بيانات التحقق")
    } finally {
      setIsLoaded(true)
    }
  }, [searchParams, t])

  const canVerify = isOtpValid(otp) && !isLoading && isLoaded && !!email

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email) {
      setError(t("auth.pendingVerificationMissing") || "لا توجد بيانات للتحقق")
      return
    }

    if (!isOtpValid(otp)) {
      setError(t("auth.invalidOtp") || "رمز التحقق غير صالح")
      return
    }

    setIsLoading(true)

    try {
      if (purpose === "register") {
        await verifyRegisterOtp({ email, otpCode: otp, accountType })
        sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
        router.push(getSignInRoute(accountType))
      } else {
        await verifyPasswordResetOtp({ email, otpCode: otp })
        sessionStorage.setItem(
          PENDING_RESET_KEY,
          JSON.stringify({ email, otpCode: otp, accountType })
        )
        router.push(AUTH_ROUTES.resetPassword)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.unexpectedError") || "حدث خطأ غير متوقع")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex">
            <AppLogo showTagline />
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {purpose === "register" ? t("auth.verifyOtpTitle") : t("auth.verifyResetOtpTitle")}
            </CardTitle>
            <CardDescription>
              {purpose === "register"
                ? t("auth.verifyOtpDescription")
                : t("auth.verifyResetOtpDescription")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>{t("auth.email")}</Label>
                <Input value={email} disabled />
              </div>

              <div className="space-y-2">
                <Label>{t("auth.verificationCode")}</Label>
<InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="w-full" disabled={!canVerify}>
                {isLoading ? t("auth.verifying") : t("auth.verifyCode")}
              </Button>

              <div className="text-center">
                <Link href={AUTH_ROUTES.signIn.player} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ArrowLeft className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} /> {t("auth.backToSignIn")}
                </Link>
              </div>
            </form>
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
            <div className="h-8 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
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
