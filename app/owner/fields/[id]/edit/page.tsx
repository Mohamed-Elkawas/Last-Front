"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { FieldForm } from "@/components/fields/field-form"
import { useAuth } from "@/hooks/use-auth"
import {
  getFieldById,
  updateField,
  type FieldMutationPayload,
  type FieldRecord,
} from "@/lib/services/fields.api"

export default function EditOwnerFieldPage() {
  const params = useParams()
  const router = useRouter()
  const { hasHydrated, isAuthenticated, accountType } = useAuth()
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : ""

  const [field, setField] = useState<FieldRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadField = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setErrorMessage("Field not found")
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const nextField = await getFieldById(id)

      if (!nextField) {
        setField(null)
        setErrorMessage("Field not found")
        return
      }

      setField(nextField)
    } catch (error) {
      setField(null)
      setErrorMessage(error instanceof Error ? error.message : "Unable to load field")
    } finally {
      setLoading(false)
    }
  }, [id])

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

    void loadField()
  }, [accountType, hasHydrated, isAuthenticated, loadField])

  const handleSubmit = async (payload: FieldMutationPayload) => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const result = await updateField(id, payload)

      if (result.status === 401) {
        setErrorMessage("You must be logged in")
        return
      }

      if (result.status === 403) {
        setErrorMessage("You don't have permission")
        return
      }

      if (result.status === 404) {
        setErrorMessage("Field not found")
        return
      }

      if (result.status) {
        setErrorMessage(result.message || "Unable to update field")
        return
      }

      router.push("/owner/fields")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update field")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (!field) {
    return <div className="text-sm text-destructive">{errorMessage || "Field not found"}</div>
  }

  return (
    <FieldForm
      initialValue={field}
      title="Edit Field"
      description="Update field information using the live backend API."
      submitLabel="Save Changes"
      loading={submitting}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
    />
  )
}
