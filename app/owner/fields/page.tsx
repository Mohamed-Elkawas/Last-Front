"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useAuth } from "@/hooks/use-auth"
import { deleteField, getOwnerFields, type FieldRecord } from "@/lib/services/fields.api"

export default function OwnerFieldsPage() {
  const router = useRouter()
  const { t } = useAppTranslations()
  const { hasHydrated, isAuthenticated, session, accountType } = useAuth()

  const [fields, setFields] = useState<FieldRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadFields = useCallback(async () => {
    if (!session?.userId) {
      setFields([])
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const nextFields = await getOwnerFields(session.userId)
      setFields(nextFields)
    } catch (error) {
      setFields([])
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [session?.userId])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    if (!isAuthenticated) {
      setLoading(false)
      setErrorMessage("You must be logged in")
      return
    }

    if (accountType !== "owner") {
      setLoading(false)
      setErrorMessage("You don't have permission")
      return
    }

    void loadFields()
  }, [accountType, hasHydrated, isAuthenticated, loadFields])

  const handleDelete = async (fieldId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this field?")
    if (!confirmed) {
      return
    }

    setBusyId(fieldId)
    setErrorMessage(null)

    try {
      const result = await deleteField(fieldId)

      if (result.status === 401) {
        setErrorMessage("You must be logged in")
        return
      }

      if (result.status === 403) {
        setErrorMessage("You don't have permission")
        return
      }

      if (result.status && result.status >= 400) {
        setErrorMessage(result.message || "Unable to delete field")
        return
      }

      setFields((current) => current.filter((field) => field.id !== fieldId))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete field")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t("ownerFields.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("ownerFields.subtitle")}</p>
        </div>

        <Button asChild>
          <Link href="/owner/fields/new">
            <Plus className="h-4 w-4" />
            {t("ownerFields.newField")}
          </Link>
        </Button>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("common.status")}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {fields.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-medium">No fields yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first field to start managing it from the owner dashboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {fields.map((field) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-2">
                  <CardTitle>{field.name.en || field.name.ar}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {field.location.en || field.location.ar || field.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {field.price.min}-{field.price.max} {t("common.egp")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/owner/fields/${field.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Field
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === field.id}
                    onClick={() => void handleDelete(field.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Field
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
