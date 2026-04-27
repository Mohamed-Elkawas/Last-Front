"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, ArrowRight, MapPin, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslate } from "@/hooks/use-translate"
import { toast } from "@/hooks/use-toast"
import { ClientDirectionShell } from "@/components/layout/client-direction-shell"
import { registerPlayer } from "@/lib/services/auth.service"
import { useResumePendingAction } from "@/lib/auth/require-auth"
import { AUTH_ROUTES, getSignInRoute } from "@/lib/auth/routes"

export function SignUpPageContent() {
  const router = useRouter()
  const { t } = useTranslate()
  const { clearAction } = useResumePendingAction()

  const positions = useMemo(
    () => [
      { value: "goalkeeper", label: t("auth.positionGoalkeeper") },
      { value: "defender", label: t("auth.positionDefender") },
      { value: "midfielder", label: t("auth.positionMidfielder") },
      { value: "winger", label: t("auth.positionWinger") },
      { value: "striker", label: t("auth.positionStriker") },
    ],
    [t],
  )

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [accountType, setAccountType] = useState<"player" | "owner">("player")
  const PENDING_VERIFICATION_KEY = "hagzaya-auth-pending-verification"
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
    password: "",
    position: "midfielder",
    skillLevel: 3,
  })

  const validateStepOne = () => {
    if (!formData.firstName.trim()) return "الاسم الأول مطلوب"
    if (!formData.lastName.trim()) return "اسم العائلة مطلوب"
    if (!formData.username.trim()) return "اسم المستخدم مطلوب"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return "البريد الإلكتروني غير صحيح"
    if (!/^01[0-9]{9}$/.test(formData.phone.trim())) return "رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 01"
    if (!formData.password || formData.password.length < 6) return "كلمة المرور يجب ألا تقل عن 6 أحرف"
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (accountType === "owner") {
      router.push(AUTH_ROUTES.signUp.owner)
      return
    }

    if (step === 1) {
      const validationError = validateStepOne()
      if (validationError) {
        setError(validationError)
        return
      }

      setStep(2)
      return
    }

    try {
      setIsLoading(true)
      setError("")

      console.log("[Signup] Calling registerPlayer with payload:", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        position: formData.position,
        skillLevel: Number(formData.skillLevel),
      })

      const result = await registerPlayer({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        position: formData.position,
        skillLevel: Number(formData.skillLevel),
      })

      console.log("[Signup] registerPlayer succeeded:", result)

      const pendingVerification = {
        email: formData.email.trim().toLowerCase(),
        accountType: "player" as const,
        purpose: "register" as const,
      }
      sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(pendingVerification))

      toast({
        title: t("auth.verifyEmailSentTitle"),
        description: t("auth.verifyEmailSentDescription"),
      })

      clearAction()
      router.push(`${AUTH_ROUTES.verifyOtp}?purpose=register&type=player`)
    } catch (err) {
      console.error("[Signup] Error during registration:", err)
      
      let errorMessage = "حدث خطأ أثناء إنشاء الحساب"

      if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "تعذر الاتصال بالخادم. تحقق من CORS أو رابط API."
        console.error("[Signup] Fetch error - likely network or CORS issue:", err.message)
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const skillLabel = (level: number) => {
    switch (level) {
      case 1:
        return t("auth.beginner")
      case 2:
        return t("auth.casualPlayer")
      case 3:
        return t("auth.intermediate")
      case 4:
        return t("auth.advanced")
      case 5:
        return t("auth.professional")
      default:
        return ""
    }
  }

  return (
    <ClientDirectionShell className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.createAccountTitle")}</CardTitle>
            <CardDescription>{step === 1 ? t("auth.createAccountStep1") : t("auth.createAccountStep2")}</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>

            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-3">
                    <Label>{t("auth.accountTypeLabel")}</Label>
                    <RadioGroup
                      value={accountType}
                      onValueChange={(value) => {
                        const nextType = value as "player" | "owner"
                        setAccountType(nextType)

                        if (nextType === "owner") {
                          router.push(AUTH_ROUTES.signUp.owner)
                        }
                      }}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div>
                        <RadioGroupItem value="player" id="player-account" className="peer sr-only" />
                        <Label
                          htmlFor="player-account"
                          className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-card p-3 text-sm font-medium transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                        >
                          {t("auth.accountTypePlayer")}
                        </Label>
                      </div>

                      <div>
                        <RadioGroupItem value="owner" id="owner-account" className="peer sr-only" />
                        <Label
                          htmlFor="owner-account"
                          className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-card p-3 text-sm font-medium transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                        >
                          {t("auth.accountTypeOwner")}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                      <div className="relative">
                        <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder={t("authForms.enterFirstName")}
                          className="ps-10"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                      <div className="relative">
                        <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder={t("authForms.enterLastName")}
                          className="ps-10"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">{t("auth.username")}</Label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input
                        id="username"
                        type="text"
                        placeholder={t("authForms.enterUsername")}
                        className="ps-8"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("auth.usernameHint")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("authForms.emailPlaceholder")}
                        className="ps-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("auth.phoneNumber")}</Label>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        className="ps-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="age">{t("auth.age")}</Label>
                      <div className="relative">
                        <CalendarDays className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="age"
                          type="number"
                          min="1"
                          placeholder="##"
                          className="ps-10"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">{t("auth.gender")}</Label>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">{t("auth.selectGender")}</option>
                        <option value="male">{t("auth.male")}</option>
                        <option value="female">{t("auth.female")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t("auth.address")}</Label>
                    <div className="relative">
                      <MapPin className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="address"
                        type="text"
                        placeholder={t("authForms.enterAddress")}
                        className="ps-10"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("authForms.createStrongPassword")}
                        className="ps-10 pe-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? t("common.creating") : t("authForms.continueArrow")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label>{t("authForms.positionLabel")}</Label>
                    <RadioGroup
                      value={formData.position}
                      onValueChange={(value) => setFormData({ ...formData, position: value })}
                      className="grid grid-cols-2 gap-2"
                    >
                      {positions.map((pos) => (
                        <div key={pos.value}>
                          <RadioGroupItem value={pos.value} id={pos.value} className="peer sr-only" />
                          <Label
                            htmlFor={pos.value}
                            className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-card p-3 text-sm font-medium transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                          >
                            {pos.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>{t("authForms.skillLabel")}</Label>
                    <div className="flex items-center justify-between gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({ ...formData, skillLevel: level })}
                          className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-lg font-semibold transition-colors ${
                            formData.skillLevel >= level
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted bg-card hover:bg-accent"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">{skillLabel(formData.skillLevel)}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => setStep(1)}>
                      <ArrowLeft className="h-4 w-4 icon-arrow-back" />
                      {t("authForms.backArrow")}
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? t("common.creating") : t("auth.createAccount")}
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{t("auth.alreadyHaveAccount")} </span>
              <Link href={getSignInRoute(accountType)} className="text-primary hover:underline">
                {t("authForms.signInPrompt")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDirectionShell>
  )
}