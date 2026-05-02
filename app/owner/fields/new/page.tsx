"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { FieldForm } from "@/components/fields/field-form"
import { useAuth } from "@/hooks/use-auth"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { createField, type FieldMutationPayload } from "@/lib/services/fields.api"

const pageText = {
  ar: {
    loading: "جاري التحميل...",
    loginRequired: "يجب تسجيل الدخول أولًا",
    noPermission: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
    createFailed: "تعذر إنشاء الملعب",
    createTitle: "إنشاء ملعب",
    createDescription: "أضف ملعبًا جديدًا باستخدام النظام.",
    createSubmit: "إنشاء الملعب",
  },
  en: {
    loading: "Loading...",
    loginRequired: "You must be logged in",
    noPermission: "You don't have permission to perform this action",
    createFailed: "Unable to create field",
    createTitle: "Create Field",
    createDescription: "Add a new field using the system.",
    createSubmit: "Create Field",
  },
} as const

export default function NewOwnerFieldPage() {
  const router = useRouter()
  const { hasHydrated, isAuthenticated, accountType } = useAuth()
  const { language, isArabic } = useAppTranslations()

  const text = useMemo(() => {
    return pageText[isArabic || language === "ar" ? "ar" : "en"]
  }, [isArabic, language])

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (payload: FieldMutationPayload) => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const result = await createField(payload)

      if (result.status === 401) {
        setErrorMessage(text.loginRequired)
        return
      }

      if (result.status === 403) {
        setErrorMessage(text.noPermission)
        return
      }

      if (result.status) {
        setErrorMessage(result.message || text.createFailed)
        return
      }

      router.push("/owner/fields")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text.createFailed)
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasHydrated) {
    return <div className="text-sm text-muted-foreground">{text.loading}</div>
  }

  if (!isAuthenticated) {
    return <div className="text-sm text-destructive">{text.loginRequired}</div>
  }

  if (accountType !== "owner") {
    return <div className="text-sm text-destructive">{text.noPermission}</div>
  }

  return (
    <FieldForm
      title={text.createTitle}
      description={text.createDescription}
      submitLabel={text.createSubmit}
      loading={submitting}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
    />
  )
}