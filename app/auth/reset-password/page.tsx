"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"

import { AppLogo } from "@/components/ui/app-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTranslate } from "@/hooks/use-translate"
import { resetPassword } from "@/lib/services/auth.service"
import { AUTH_ROUTES } from "@/lib/auth/routes"

const PENDING_RESET_KEY = "hagzaya-auth-pending-reset"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t, isArabic } = useTranslate()

  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [accountType, setAccountType] = useState<"player" | "owner">("player")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const pendingRaw = sessionStorage.getItem(PENDING_RESET_KEY)

    if (!pendingRaw) {
      setError(t("auth.resetSessionExpired") || "انتهت صلاحية جلسة إعادة التعيين")
      setIsLoaded(true)
      return
    }

    try {
      const pending = JSON.parse(pendingRaw) as {
        email?: string
        otp?: string
        otpCode?: string
        accountType?: "player" | "owner"
      }

      const savedOtp = pending.otp || pending.otpCode

      if (!pending.email || !savedOtp) {
        throw new Error("invalid pending reset payload")
      }

      setEmail(pending.email)
      setOtp(savedOtp)

      if (pending.accountType === "owner") {
        setAccountType("owner")
      }
    } catch {
      setError(t("auth.resetSessionInvalid") || "تعذر قراءة بيانات إعادة التعيين")
    } finally {
      setIsLoaded(true)
    }
  }, [t])

  const passwordsMatch = password === confirmPassword

  const canReset =
    !!password &&
    !!confirmPassword &&
    passwordsMatch &&
    !isLoading &&
    isLoaded &&
    !!email &&
    !!otp

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email || !otp) {
      setError(t("auth.resetSessionExpired") || "انتهت صلاحية جلسة إعادة التعيين")
      return
    }

    if (!password || !confirmPassword) {
      setError(t("auth.requiredPasswordFields") || "الرجاء إدخال كلمة المرور وتأكيدها")
      return
    }

    if (!passwordsMatch) {
      setError(t("auth.passwordsDoNotMatch") || "كلمتا المرور غير متطابقتين")
      return
    }

    setIsLoading(true)

    try {
  await resetPassword({
  email,
  otpCode: otp,
  newPassword: password,
  confirmPassword,
})         
      sessionStorage.removeItem(PENDING_RESET_KEY)

      router.push(
        accountType === "owner"
          ? AUTH_ROUTES.signIn.owner
          : AUTH_ROUTES.signIn.player,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("auth.unexpectedError") || "حدث خطأ غير متوقع",
      )
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
              {t("auth.resetPasswordTitle")}
            </CardTitle>
            <CardDescription>
              {t("auth.resetPasswordDescription")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("auth.email")}</Label>
                <Input value={email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("auth.enterNewPassword")}
                    className="ps-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("auth.confirmPassword")}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("auth.enterNewPassword")}
                    className="ps-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={!canReset}>
                {isLoading ? t("auth.resetting") : t("auth.setNewPassword")}
              </Button>

              <div className="text-center">
                <Link
                  href={
                    accountType === "owner"
                      ? AUTH_ROUTES.signIn.owner
                      : AUTH_ROUTES.signIn.player
                  }
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                  {t("auth.backToSignIn")}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}