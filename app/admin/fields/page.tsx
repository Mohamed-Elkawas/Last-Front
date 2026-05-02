"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import {
  approveField,
  getPendingFields,
  type FieldRecord,
} from "@/lib/services/fields.api"

export default function AdminFieldsPage() {
  const { hasHydrated, isAuthenticated, session } = useAuth()
  const [fields, setFields] = useState<FieldRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectionDrafts, setRejectionDrafts] = useState<Record<string, string>>({})

  const isAdmin = session?.roles.includes("admin") ?? false

  const loadFields = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const nextFields = await getPendingFields()
      setFields(nextFields)
    } catch (error) {
      setFields([])
      setErrorMessage(error instanceof Error ? error.message : "Unable to load pending fields")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    if (!isAuthenticated) {
      setLoading(false)
      setErrorMessage("You must be logged in")
      return
    }

    if (!isAdmin) {
      setLoading(false)
      setErrorMessage("You don't have permission")
      return
    }

    void loadFields()
  }, [hasHydrated, isAdmin, isAuthenticated, loadFields])

  const handleApprove = async (fieldId: string, isApproved: boolean) => {
    if (!isApproved && !(rejectionDrafts[fieldId] ?? "").trim()) {
      setErrorMessage("Rejection reason is required")
      return
    }

    setBusyId(fieldId)
    setErrorMessage(null)

    try {
      const result = await approveField({
        fieldId,
        isApproved,
        rejectionReason: isApproved ? undefined : rejectionDrafts[fieldId]?.trim() || undefined,
      })

      if (result.status === 401) {
        setErrorMessage("You must be logged in")
        return
      }

      if (result.status === 403) {
        setErrorMessage("You don't have permission")
        return
      }

      if (result.status) {
        setErrorMessage(result.message || "Unable to review field")
        return
      }

      setFields((current) => current.filter((field) => field.id !== fieldId))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to review field")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-3xl font-semibold">Pending Fields</h1>
        <p className="text-sm text-muted-foreground">
          Review field submissions from owners using the live moderation API.
        </p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Status</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {fields.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-medium">No pending fields</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New owner submissions will appear here when available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {fields.map((field) => (
            <Card key={field.id}>
              <CardHeader>
                <CardTitle>{field.name.en || field.name.ar}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {field.location.en || field.location.ar || field.address}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Field Type</p>
                    <p className="text-sm text-muted-foreground">{field.type || field.pitchSizes[0] || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Pricing</p>
                    <p className="text-sm text-muted-foreground">
                      {field.price.min}-{field.price.max} EGP
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`rejection-${field.id}`}>Rejection Reason</Label>
                  <Textarea
                    id={`rejection-${field.id}`}
                    value={rejectionDrafts[field.id] ?? ""}
                    onChange={(event) =>
                      setRejectionDrafts((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                    placeholder="Provide a reason if rejecting this field"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    disabled={busyId === field.id}
                    onClick={() => void handleApprove(field.id, true)}
                  >
                    Approve
                  </Button>

                  <Button
                    variant="outline"
                    disabled={busyId === field.id}
                    onClick={() => void handleApprove(field.id, false)}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
