"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { useAppTranslations } from "@/hooks/use-app-translations"
import { useAuth } from "@/hooks/use-auth"
import { getOwnerFields, type FieldRecord } from "@/lib/services/fields.api"
import { createTournament } from "@/lib/services/tournaments.api"

type FormState = {
  name: string
  numberOfTeams: string
  prize: string
  description: string
  price: string
  type: string
  startDate: string
  endDate: string
  fieldId: string
}

function toIsoDateTime(value: string): string {
  const date = new Date(value)
  return date.toISOString()
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const { language, hasHydrated } = useAppTranslations()
  const { session, hasHydrated: authHydrated, isAuthenticated, accountType } = useAuth()
  const isArabic = language === "ar"
  const isAdmin = session?.roles.includes("admin") ?? false

  const [fields, setFields] = useState<FieldRecord[]>([])
  const [loadingFields, setLoadingFields] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    name: "",
    numberOfTeams: "",
    prize: "",
    description: "",
    price: "",
    type: "",
    startDate: "",
    endDate: "",
    fieldId: "",
  })

  const labels = {
    title: isArabic ? "إنشاء بطولة" : "Create Tournament",
    subtitle: isArabic
      ? "أنشئ بطولة مرتبطة بأحد ملاعبك الحقيقية."
      : "Create a tournament linked to one of your real fields.",
    back: isArabic ? "العودة للبطولات" : "Back to tournaments",
    noPermission: isArabic
      ? "إنشاء البطولات متاح فقط للحسابات التي تحمل صلاحية المشرف."
      : "Tournament creation is only available for accounts with the admin role.",
    noFields: isArabic ? "لا توجد ملاعب متاحة" : "No fields available",
    noFieldsBody: isArabic
      ? "أنشئ ملعباً أولاً قبل إنشاء بطولة."
      : "Create a field first before creating a tournament.",
    createField: isArabic ? "إنشاء ملعب" : "Create Field",
    submit: isArabic ? "إنشاء البطولة" : "Create Tournament",
    fieldId: isArabic ? "الملعب" : "Field",
    name: isArabic ? "اسم البطولة" : "Tournament name",
    teams: isArabic ? "عدد الفرق" : "Number of teams",
    prize: isArabic ? "الجائزة" : "Prize",
    description: isArabic ? "الوصف" : "Description",
    price: isArabic ? "السعر" : "Price",
    type: isArabic ? "النوع" : "Type",
    startDate: isArabic ? "تاريخ البداية" : "Start date",
    endDate: isArabic ? "تاريخ النهاية" : "End date",
    selectField: isArabic ? "اختر ملعباً" : "Select a field",
    selectType: isArabic ? "اختر النوع" : "Select type",
    validation: {
      required: isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields",
      teams: isArabic ? "عدد الفرق يجب أن يكون أكبر من 1" : "Number of teams must be greater than 1",
      price: isArabic ? "السعر يجب أن يكون 0 أو أكثر" : "Price must be 0 or greater",
      dateOrder: isArabic ? "يجب أن يكون تاريخ النهاية بعد البداية" : "End date must be after start date",
      field: isArabic ? "يجب اختيار ملعب حقيقي" : "A real field must be selected",
      login: isArabic ? "يجب تسجيل الدخول أولاً" : "You must be logged in",
      permission: isArabic ? "ليس لديك صلاحية" : "You don't have permission",
    },
  }

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.numberOfTeams.trim().length > 0 &&
      form.prize.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.price.trim().length > 0 &&
      form.type.trim().length > 0 &&
      form.startDate.trim().length > 0 &&
      form.endDate.trim().length > 0 &&
      form.fieldId.trim().length > 0 &&
      isAdmin &&
      fields.length > 0
    )
  }, [fields.length, form, isAdmin])

  const loadFields = useCallback(async () => {
    if (!session?.userId) {
      setFields([])
      setLoadingFields(false)
      return
    }

    setLoadingFields(true)
    setErrorMessage(null)

    try {
      const ownerFields = await getOwnerFields(session.userId)
      setFields(ownerFields)
    } catch (error) {
      setFields([])
      setErrorMessage(error instanceof Error ? error.message : labels.validation.permission)
    } finally {
      setLoadingFields(false)
    }
  }, [labels.validation.permission, session?.userId])

  useEffect(() => {
    if (!hasHydrated || !authHydrated) return

    if (!isAuthenticated) {
      setLoadingFields(false)
      setErrorMessage(labels.validation.login)
      return
    }

    if (accountType !== "owner") {
      setLoadingFields(false)
      setErrorMessage(labels.validation.permission)
      return
    }

    void loadFields()
  }, [accountType, authHydrated, hasHydrated, isAuthenticated, labels.validation.login, labels.validation.permission, loadFields])

  const update = (key: keyof FormState, value: string) => {
    setErrorMessage(null)
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const numberOfTeams = Number(form.numberOfTeams)
    const price = Number(form.price)
    const fieldId = Number(form.fieldId)

    if (!canSubmit) {
      setErrorMessage(labels.validation.required)
      return
    }

    if (numberOfTeams <= 1) {
      setErrorMessage(labels.validation.teams)
      return
    }

    if (price < 0) {
      setErrorMessage(labels.validation.price)
      return
    }

    if (!Number.isFinite(fieldId) || !fields.some((field) => Number(field.id) === fieldId)) {
      setErrorMessage(labels.validation.field)
      return
    }

    const startDate = new Date(form.startDate)
    const endDate = new Date(form.endDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setErrorMessage(labels.validation.dateOrder)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const result = await createTournament({
        name: form.name.trim(),
        numberOfTeams,
        prize: form.prize.trim(),
        description: form.description.trim(),
        price,
        type: form.type.trim(),
        startDate: toIsoDateTime(form.startDate),
        endDate: toIsoDateTime(form.endDate),
        fieldId,
      })

      if (result.status === 401) {
        setErrorMessage(labels.validation.login)
        return
      }

      if (result.status === 403) {
        setErrorMessage(labels.validation.permission)
        return
      }

      if (result.status) {
        setErrorMessage(result.message || labels.validation.permission)
        return
      }

      router.push("/owner/tournaments")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : labels.validation.permission)
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasHydrated || !authHydrated || loadingFields) {
    return <div className="text-sm text-muted-foreground">{isArabic ? "جارٍ التحميل..." : "Loading..."}</div>
  }

  if (fields.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/owner/tournaments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {labels.back}
          </Link>
        </Button>

        <Card>
          <CardContent className="space-y-4 p-8">
            <h1 className="text-2xl font-semibold">{labels.noFields}</h1>
            <p className="text-sm text-muted-foreground">{labels.noFieldsBody}</p>
            <Button asChild>
              <Link href="/owner/fields/new">{labels.createField}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div>
        <Button asChild variant="ghost" className="mb-3 px-0">
          <Link href="/owner/tournaments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {labels.back}
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">{labels.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{labels.subtitle}</p>
      </div>

      {!isAdmin ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{labels.title}</AlertTitle>
          <AlertDescription>{labels.noPermission}</AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{labels.title}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{labels.title}</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="field-id">{labels.fieldId}</Label>
              <Select value={form.fieldId} onValueChange={(value) => update("fieldId", value)}>
                <SelectTrigger id="field-id">
                  <SelectValue placeholder={labels.selectField} />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={String(field.id)}>
                      {(field.name[language] || field.name.en || field.name.ar) + ` (#${field.id})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{labels.name}</Label>
              <Input id="name" value={form.name} onChange={(event) => update("name", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{labels.type}</Label>
              <Select value={form.type} onValueChange={(value) => update("type", value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder={labels.selectType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="league">{isArabic ? "دوري" : "League"}</SelectItem>
                  <SelectItem value="knockout">{isArabic ? "إقصائي" : "Knockout"}</SelectItem>
                  <SelectItem value="groups">{isArabic ? "مجموعات" : "Groups"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teams">{labels.teams}</Label>
              <Input
                id="teams"
                type="number"
                min="2"
                value={form.numberOfTeams}
                onChange={(event) => update("numberOfTeams", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{labels.price}</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prize">{labels.prize}</Label>
              <Input id="prize" value={form.prize} onChange={(event) => update("prize", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">{labels.startDate}</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">{labels.endDate}</Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={form.endDate}
                onChange={(event) => update("endDate", event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">{labels.description}</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={!canSubmit || submitting}>
                {submitting ? (isArabic ? "جارٍ الإنشاء..." : "Creating...") : labels.submit}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
