"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, Phone } from "lucide-react"
import { AppLogo } from "@/components/ui/app-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslate } from "@/hooks/use-translate"
import { signIn } from "@/lib/services/auth.service"
import { useResumePendingAction } from "@/lib/auth/require-auth"
import { AUTH_ROUTES, getPostLoginRoute, getSignInRoute, type AuthAccountType } from "@/lib/auth/routes"

type SignInPageContentProps = {
  accountType: AuthAccountType
}

export function SignInPageContent({ accountType }: SignInPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get("reset") === "success"

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const { t } = useTranslate()
  const { redirectPath, clearAction } = useResumePendingAction()

  const getErrorMessage = (err: unknown) => {
    if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
      return "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت أو رابط API أو إعدادات CORS."
    }

    if (err instanceof Error && err.message.trim()) {
      return err.message
    }

    return "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
  }

  const handleSubmit = async (e: React.FormEvent, mode: "email" | "phone") => {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)
    setError("")

    const payload =
      mode === "email"
        ? { email: email.trim().toLowerCase(), password, accountType }
        : { phone: phone.replace(/\s+/g, ""), password, accountType }

    try {
      await signIn(payload)

      const nextRoute =
        accountType === "player" && redirectPath
          ? redirectPath
          : getPostLoginRoute(accountType)

      clearAction()
      router.push(nextRoute)
    } catch (err) {
      console.error("[SignIn] Error:", err)
      setError(getErrorMessage(err))
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
            <CardTitle className="text-2xl">{t("auth.welcomeBack")}</CardTitle>
            <CardDescription>{t("auth.signInSubtitle")}</CardDescription>
          </CardHeader>

          <CardContent>
            {resetSuccess ? (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                {t("auth.passwordResetSuccess")}
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mb-4 space-y-2">
              <RadioGroup
                value={accountType}
                onValueChange={(value) => {
                  setError("")
                  router.push(getSignInRoute(value as AuthAccountType))
                }}
                className="grid grid-cols-2 gap-2"
              >
                <div>
                  <RadioGroupItem value="player" id="signin-player-account" className="peer sr-only" />
                  <Label
                    htmlFor="signin-player-account"
                    className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-card p-3 text-sm font-medium transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                  >
                    {t("auth.accountTypePlayer")}
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="owner" id="signin-owner-account" className="peer sr-only" />
                  <Label
                    htmlFor="signin-owner-account"
                    className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-card p-3 text-sm font-medium transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                  >
                    {t("auth.accountTypeOwner")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Tabs defaultValue="email" className="w-full" onValueChange={() => setError("")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">{t("auth.email")}</TabsTrigger>
                <TabsTrigger value="phone">{t("auth.phone")}</TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={(e) => handleSubmit(e, "email")} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("authForms.emailPlaceholder")}
                        className="ps-10"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setError("")
                        }}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t("auth.password")}</Label>
                      <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                        {t("auth.forgotPassword")}
                      </Link>
                    </div>

                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.enterPassword")}
                        className="ps-10 pe-10"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError("")
                        }}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t("auth.signingIn") : t("auth.signIn")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                <form onSubmit={(e) => handleSubmit(e, "phone")} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("auth.phoneNumber")}</Label>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+20 1X XXX XXXX"
                        className="ps-10"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value)
                          setError("")
                        }}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone-password">{t("auth.password")}</Label>
                      <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                        {t("auth.forgotPassword")}
                      </Link>
                    </div>

                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone-password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.enterPassword")}
                        className="ps-10 pe-10"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError("")
                        }}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t("auth.signingIn") : t("auth.signIn")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{`${t("auth.noAccount")} `}</span>
              <Link href={AUTH_ROUTES.signUp.player} className="text-primary hover:underline">
                {t("auth.createAccount")}
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link href="/auth/owner-register" className="text-sm text-muted-foreground hover:text-primary">
                {t("auth.ownerRegisterLink")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}