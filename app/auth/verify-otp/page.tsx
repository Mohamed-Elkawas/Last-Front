"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, RotateCcw } from "lucide-react"

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
const OTP_LENGTH = 6
const RESEND_SECONDS = 60
const MAX_ATTEMPTS = 5

type AccountType = "player" | "owner"
type OtpPurpose = "register" | "reset"

type PendingOtpData = {
  email: string
  accountType?: AccountType
  purpose?: OtpPurpose
}

function normalizeOtp(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH)
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
  const { t } = useTranslate()

  const otpInputRef = useRef<HTMLInputElement | null>(null)
  const hasAutoSubmittedRef = useRef(false)

  const [email, setEmail] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("player")
  const [purpose, setPurpose] = useState<OtpPurpose>("register")
  const [otpValue, setOtpValue] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [timer, setTimer] = useState(RESEND_SECONDS)
  const [attempts, setAttempts] = useState(0)

  const otpDigits = otpValue.padEnd(OTP_LENGTH, " ").split("")
  const isLocked = attempts >= MAX_ATTEMPTS
  const canVerify = isOtpValid(otpValue) && !isLoading && isLoaded && !!email && !isLocked
  const canResend = timer === 0 && !isLoading && isLoaded && !!email

  const backHref = useMemo(() => {
    return purpose === "reset" ? AUTH_ROUTES.forgotPassword : getSignInRoute(accountType)
  }, [accountType, purpose])

  const focusOtpInput = useCallback(() => {
    otpInputRef.current?.focus()
  }, [])

  const resetOtp = useCallback(() => {
    setOtpValue("")
    hasAutoSubmittedRef.current = false
    setTimeout(focusOtpInput, 0)
  }, [focusOtpInput])

  const getErrorMessage = useCallback(
    (err: unknown) => {
      if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
        return "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت أو رابط API أو إعدادات CORS."
      }

      if (err instanceof Error && err.message.trim()) {
        const message = err.message.toLowerCase()

        if (message.includes("expired")) return "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا."
        if (message.includes("invalid") || message.includes("wrong")) return "رمز التحقق غير صحيح."
        if (message.includes("too many")) return "محاولات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى."

        return err.message
      }

      return t("auth.unexpectedError")
    },
    [t],
  )

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

  useEffect(() => {
    if (isLoaded && !error) {
      focusOtpInput()
    }
  }, [isLoaded, error, focusOtpInput])

  useEffect(() => {
    if (timer <= 0) return

    const interval = window.setInterval(() => {
      setTimer((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [timer])

  const verifyOtp = useCallback(async () => {
    if (!isOtpValid(otpValue) || isLoading || !email || isLocked) return

    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (purpose === "register") {
        await verifyRegisterOtp({
          email,
          otpCode: otpValue,
          accountType,
        })

        sessionStorage.removeItem(PENDING_REGISTER_KEY)
        setSuccessMessage("تم تأكيد الحساب بنجاح. سيتم تحويلك الآن.")
        router.push(getSignInRoute(accountType))
        return
      }

      await verifyPasswordResetOtp({
        email,
        otpCode: otpValue,
      })

      setSuccessMessage("تم تأكيد الرمز بنجاح.")
      router.push(AUTH_ROUTES.resetPassword)
    } catch (err) {
      setAttempts((current) => current + 1)
      setError(getErrorMessage(err))
      resetOtp()
    } finally {
      setIsLoading(false)
    }
  }, [
    accountType,
    email,
    getErrorMessage,
    isLoading,
    isLocked,
    otpValue,
    purpose,
    resetOtp,
    router,
  ])

  useEffect(() => {
    if (!canVerify) {
      hasAutoSubmittedRef.current = false
      return
    }

    if (hasAutoSubmittedRef.current) return

    hasAutoSubmittedRef.current = true
    void verifyOtp()
  }, [canVerify, verifyOtp])

  const handleOtpChange = (value: string) => {
    if (isLoading || isLocked) return

    setError("")
    setSuccessMessage("")
    setOtpValue(normalizeOtp(value))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (isLocked) {
      setError("تم تجاوز عدد المحاولات المسموح. اطلب رمزًا جديدًا.")
      return
    }

    if (!isOtpValid(otpValue)) {
      setError(t("auth.invalidOtp"))
      focusOtpInput()
      return
    }

    void verifyOtp()
  }

  const handleResend = async () => {
    if (!canResend) return

    setError("")
    setSuccessMessage("تم تجهيز طلب إعادة الإرسال. اربط هنا API إعادة إرسال الكود.")
    setTimer(RESEND_SECONDS)
    setAttempts(0)
    resetOtp()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="mb-8 text-center">
          <AppLogo showTagline />
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.verifyOtpTitle")}</CardTitle>
            <CardDescription>
              {email ? (
                <>
                  {t("auth.verifyOtpDescription")}
                  <span className="mt-1 block font-medium text-foreground">{email}</span>
                </>
              ) : (
                t("auth.verifyOtpDescription")
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {isLocked ? (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                تم إيقاف المحاولات مؤقتًا بعد {MAX_ATTEMPTS} محاولات. اطلب رمزًا جديدًا.
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                className="relative flex justify-center"
                dir="ltr"
                onClick={focusOtpInput}
              >
                <input
                  ref={otpInputRef}
                  value={otpValue}
                  onChange={(event) => handleOtpChange(event.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  disabled={isLoading || !isLoaded || isLocked}
                  aria-label="Verification code"
                  className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                />

                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => {
                    const isActive =
                      !isLoading &&
                      !isLocked &&
                      isLoaded &&
                      (otpValue.length === index ||
                        (otpValue.length === OTP_LENGTH && index === OTP_LENGTH - 1))

                    return (
                      <div
                        key={index}
                        className={`
                          flex h-12 w-12 items-center justify-center rounded-xl border
                          text-center text-xl font-bold transition sm:h-14 sm:w-14
                          ${
                            isActive
                              ? "border-green-600 ring-2 ring-green-600/20"
                              : "border-green-300"
                          }
                          ${
                            isLoading || !isLoaded || isLocked
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-text"
                          }
                        `}
                      >
                        {digit.trim()}
                      </div>
                    )
                  })}
                </div>
              </div>

              <Button type="submit" disabled={!canVerify} className="w-full">
                {isLoading ? t("auth.verifying") : t("auth.verifyCode")}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {timer > 0 ? (
                  <span>يمكنك إعادة إرسال الكود بعد {timer} ثانية</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend}
                    className="inline-flex items-center gap-2 font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    إعادة إرسال الكود
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                رجوع
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyOtpPageContent />
    </Suspense>
  )
}