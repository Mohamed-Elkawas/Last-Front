"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Upload,
  FileText,
  Camera,
  ArrowLeft,
  Mail,
  CalendarDays,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslate } from "@/hooks/use-translate"
import { ClientDirectionShell } from "@/components/layout/client-direction-shell"
import { registerOwner } from "@/lib/services/auth.service"
import { AUTH_ROUTES } from "@/lib/auth/routes"

const PENDING_VERIFICATION_KEY = "hagzaya-auth-pending-verification"

export default function OwnerRegisterPage() {
  const router = useRouter()
  const { t } = useTranslate()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const photoInputRef = useRef<HTMLInputElement>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
    password: "",
    photo: null as File | null,
    license: null as File | null,
  })

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    setFormData((prev) => ({ ...prev, photo: file }))

    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    setFormData((prev) => ({ ...prev, license: file }))
    setLicenseFileName(file.name)
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) return "الاسم الأول مطلوب"
    if (!formData.lastName.trim()) return "اسم العائلة مطلوب"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return "البريد الإلكتروني غير صحيح"
    }
    if (!/^01[0-9]{9}$/.test(formData.phone.trim())) {
      return "رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 01"
    }
    if (!formData.age || Number(formData.age) < 18) {
      return "عمر المالك يجب ألا يقل عن 18 سنة"
    }
    if (!formData.gender) return "النوع مطلوب"
    if (!formData.address.trim()) return "عنوان الملعب مطلوب"
    if (!formData.password || formData.password.length < 6) {
      return "كلمة المرور يجب ألا تقل عن 6 أحرف"
    }

    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      const email = formData.email.trim().toLowerCase()

      await registerOwner({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: email,
        email,
        phone: formData.phone.trim(),
        password: formData.password,
        playgroundAddress: formData.address.trim(),
        photoUrl: null,
        businessLicenseUrl: null,
      })

      sessionStorage.setItem(
        PENDING_VERIFICATION_KEY,
        JSON.stringify({
          email,
          accountType: "owner",
          purpose: "register",
        }),
      )

      router.push(`${AUTH_ROUTES.verifyOtp}?purpose=register&type=owner`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل المالك"

      setError(message)
      console.error("[Owner Register] Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ClientDirectionShell className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {t("auth.ownerRegisterTitle")}
            </CardTitle>
            <CardDescription>
              {t("auth.ownerRegisterSubtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted transition-colors hover:border-primary"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={t("authForms.previewAlt")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </button>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <p className="text-sm text-muted-foreground">
                  {t("auth.uploadPhoto")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("authForms.ownerEmailPh")}
                    className="ps-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age">{t("auth.age")}</Label>
                  <div className="relative">
                    <CalendarDays className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      placeholder="##"
                      className="ps-10"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">{t("auth.gender")}</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="">{t("auth.selectGender")}</option>
                    <option value="male">{t("auth.male")}</option>
                    <option value="female">{t("auth.female")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("auth.playgroundAddress")}</Label>
                <div className="relative">
                  <MapPin className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    placeholder={t("authForms.addressPlaygroundPh")}
                    className="min-h-[80px] ps-10"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
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
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("auth.businessLicense")}</Label>
                <button
                  type="button"
                  onClick={() => licenseInputRef.current?.click()}
                  className="flex w-full cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-start transition-colors hover:border-primary"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {licenseFileName ? (
                      <FileText className="h-6 w-6 text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {licenseFileName ? (
                      <>
                        <p className="truncate font-medium text-foreground">
                          {licenseFileName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("auth.clickToChange")}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">
                          {t("auth.uploadLicense")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("auth.licenseFormats")}
                        </p>
                      </>
                    )}
                  </div>
                </button>

                <input
                  ref={licenseInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleLicenseChange}
                  className="hidden"
                />
              </div>

              <div className="rounded-lg bg-accent/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">
                    {t("auth.adminApprovalTitle")}
                  </strong>{" "}
                  {t("auth.adminApprovalText")}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("auth.submitting") : t("auth.createAccount")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href={AUTH_ROUTES.signIn.owner}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4 icon-arrow-back" />
                {t("auth.backToSignIn")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDirectionShell>
  )
}