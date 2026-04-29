"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail } from "lucide-react"
import { AppLogo } from "@/components/ui/app-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTranslate } from "@/hooks/use-translate"
import { sendPasswordResetOtp } from "@/lib/services/auth.service"
import { AUTH_ROUTES } from "@/lib/auth/routes"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESET_PENDING_KEY = "hagzaya-auth-pending-reset"

function mapAuthError(error: unknown, t: (key: string) => string): string {
  if (!(error instanceof Error)) {
    return t("auth.unexpectedError")
  }

  switch (error.message) {
    case "INVALID_EMAIL":
    case "EMAIL_REQUIRED":
      return t("auth.invalidEmail")
    default:
      return t("auth.unexpectedError")
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [emailTouched, setEmailTouched] = useState(false)
  const router = useRouter()
  const { t, isArabic } = useTranslate()

  const emailIsValid = emailPattern.test(email)
  const canSendEmail = emailIsValid && !isLoading

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailTouched(true)
    setErrorMessage("")

    if (!emailIsValid) {
      setErrorMessage(t("auth.invalidEmail"))
      return
    }

    setIsLoading(true)
    try {
      await sendPasswordResetOtp({ email: email.trim().toLowerCase() })
      sessionStorage.setItem(
        RESET_PENDING_KEY,
        JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: "reset",
        }),
      )

      router.push(`${AUTH_ROUTES.verifyOtp}?purpose=reset`)

    } catch (error) {
      setErrorMessage(mapAuthError(error, t))
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
            <CardTitle className="text-2xl">{t("auth.forgotPasswordTitle")}</CardTitle>
            <CardDescription>{t("auth.forgotPasswordDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    className="ps-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    autoComplete="email"
                    required
                  />
                </div>
                {emailTouched && !emailIsValid && (
                  <p className="text-sm text-destructive">{t("auth.invalidEmail")}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!canSendEmail}>
                {isLoading ? t("auth.sending") : t("auth.sendVerificationCode")}
              </Button>

              <div className="text-center">
                <Link href="/auth/signin" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
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
