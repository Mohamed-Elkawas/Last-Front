"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, PlusCircle, Trash2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useAppTranslations } from "@/hooks/use-app-translations"
import { useAuth } from "@/hooks/use-auth"
import { getOwnerFields } from "@/lib/services/fields.api"
import {
  deleteTournament,
  getTournaments,
  type TournamentRecord,
} from "@/lib/services/tournaments.api"

export default function OwnerTournamentsPage() {
  const { language, hasHydrated } = useAppTranslations()
  const { isAuthenticated, session, accountType, hasHydrated: authHydrated } = useAuth()
  const isArabic = language === "ar"
  const isAdmin = session?.roles.includes("admin") ?? false

  const [tournaments, setTournaments] = useState<TournamentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deletingTournament, setDeletingTournament] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const labels = {
    title: isArabic ? "البطولات" : "Tournaments",
    subtitle: isArabic ? "إدارة البطولات المرتبطة بملاعبك." : "Manage tournaments linked to your fields.",
    create: isArabic ? "إنشاء بطولة" : "Create Tournament",
    listTitle: isArabic ? "بطولاتك" : "Your Tournaments",
    empty: isArabic ? "لا توجد بطولات حتى الآن" : "No tournaments yet",
    manage: isArabic ? "إدارة" : "Manage",
    deleteTitle: isArabic ? "حذف البطولة؟" : "Delete Tournament?",
    deleteDesc: isArabic
      ? "هل أنت متأكد من حذف هذه البطولة؟"
      : "Are you sure you want to delete this tournament?",
    delete: isArabic ? "حذف" : "Delete",
    cancel: isArabic ? "إلغاء" : "Cancel",
    noPermission: isArabic
      ? "لا تملك صلاحية إنشاء أو حذف البطولات من هذا الحساب."
      : "This account cannot create or delete tournaments.",
    loginRequired: isArabic ? "يجب تسجيل الدخول أولاً" : "You must be logged in",
    permissionRequired: isArabic ? "ليس لديك صلاحية الوصول" : "You don't have permission",
    fieldId: isArabic ? "معرّف الملعب" : "Field ID",
    teams: isArabic ? "الفرق" : "Teams",
    price: isArabic ? "السعر" : "Price",
  }

  const load = useCallback(async () => {
    if (!session?.userId) {
      setTournaments([])
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const [ownerFields, allTournaments] = await Promise.all([
        getOwnerFields(session.userId),
        getTournaments(),
      ])

      const ownerFieldIds = new Set(
        ownerFields
          .map((field) => field.id)
          .filter((fieldId) => fieldId !== ""),
      )

      const filtered = allTournaments.filter((tournament) => {
        const matchesField =
          tournament.fieldId !== null && ownerFieldIds.has(String(tournament.fieldId))
        const matchesOwner = tournament.ownerId !== null && tournament.ownerId === session.userId

        return matchesField || matchesOwner
      })

      setTournaments(filtered)
    } catch (error) {
      setTournaments([])
      setErrorMessage(error instanceof Error ? error.message : "Unable to load tournaments")
    } finally {
      setLoading(false)
    }
  }, [session?.userId])

  useEffect(() => {
    if (!hasHydrated || !authHydrated) return

    if (!isAuthenticated) {
      setLoading(false)
      setErrorMessage(labels.loginRequired)
      return
    }

    if (accountType !== "owner") {
      setLoading(false)
      setErrorMessage(labels.permissionRequired)
      return
    }

    void load()
  }, [accountType, authHydrated, hasHydrated, isAuthenticated, labels.loginRequired, labels.permissionRequired, load])

  const rows = useMemo(() => tournaments, [tournaments])

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!isAdmin) {
      setErrorMessage(labels.noPermission)
      setDeletingTournament(null)
      return
    }

    setBusyId(tournamentId)
    setErrorMessage(null)

    try {
      const result = await deleteTournament(tournamentId)

      if (result.status === 401) {
        setErrorMessage(labels.loginRequired)
        return
      }

      if (result.status === 403) {
        setErrorMessage(labels.permissionRequired)
        return
      }

      if (result.status) {
        setErrorMessage(result.message || labels.permissionRequired)
        return
      }

      setTournaments((current) => current.filter((item) => item.id !== tournamentId))
      setDeletingTournament(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : labels.permissionRequired)
    } finally {
      setBusyId(null)
    }
  }

  if (!hasHydrated || !authHydrated || loading) {
    return <div className="text-sm text-muted-foreground">{isArabic ? "جارٍ التحميل..." : "Loading..."}</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{labels.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>

        {isAdmin ? (
          <Button asChild className="w-fit bg-emerald-600 hover:bg-emerald-700">
            <Link href="/owner/tournaments/create">
              <PlusCircle className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
              {labels.create}
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-fit">
            <PlusCircle className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            {labels.create}
          </Button>
        )}
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

      <Card>
        <CardHeader>
          <CardTitle>{labels.listTitle}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">{labels.empty}</p>
          ) : (
            rows.map((record) => {
              const name = record.name[language] || record.name.en || record.name.ar || "-"

              return (
                <div
                  key={record.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className={isArabic ? "text-right" : "text-left"}>
                    <p className="text-lg font-semibold">{name}</p>

                    <p className="text-sm text-muted-foreground">
                      {labels.teams}: {record.teamsJoined}/{record.numberOfTeams} · {labels.price}: {record.price} {isArabic ? "جنيه" : "EGP"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {labels.fieldId}: {record.fieldId ?? "-"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Link href={`/owner/tournaments/${record.id}`}>{labels.manage}</Link>
                    </Button>

                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/40 text-red-600 hover:bg-red-50"
                        disabled={busyId === record.id}
                        onClick={() => setDeletingTournament(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingTournament} onOpenChange={(open) => !open && setDeletingTournament(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{labels.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingTournament && void handleDeleteTournament(deletingTournament)}
            >
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
