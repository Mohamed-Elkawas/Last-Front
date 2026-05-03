"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, User, Users } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useAuth } from "@/hooks/use-auth"
import { useTranslate } from "@/hooks/use-translate"
import { useTournamentDetail } from "@/hooks/use-tournaments"
import { useRequireAuth } from "@/lib/auth/require-auth"
import { createTeam, joinTournament } from "@/lib/services/tournaments.api"

export default function JoinTournamentPage() {
  const router = useRouter()
  const params = useParams()
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined

  const { t, isArabic } = useTranslate()
  const { user, hasHydrated, accountType } = useAuth()
  const { isAuthenticated, canProceed } = useRequireAuth()
  const {
    tournament,
    loading: tournamentLoading,
    error: tournamentError,
  } = useTournamentDetail(id)

  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isPlayer = accountType === "player"

  useEffect(() => {
    if (!isAuthenticated) {
      if (id) {
        canProceed("tournament_join", { tournamentId: id })
      }
      setShowAuthDialog(true)
    }
  }, [canProceed, id, isAuthenticated])

  const labels = {
    teamName: isArabic ? "اسم الفريق" : "Team name",
    teamPlaceholder: isArabic ? "مثال: نجوم المدينة" : "e.g. City Stars",
    joinHint: isArabic
      ? "سيتم إنشاء الفريق أولاً ثم إرساله للانضمام إلى البطولة."
      : "Your team will be created first, then joined to the tournament.",
    successRoute: isArabic ? "سيتم إعادتك إلى صفحة البطولة بعد نجاح الانضمام." : "You will return to the tournament page after joining successfully.",
    noPermission: isArabic ? "ليس لديك صلاحية الانضمام إلى البطولة" : "You don't have permission to join this tournament",
    invalidTournament: isArabic ? "البطولة غير موجودة" : "Tournament not found",
    loginRequired: isArabic ? "يجب تسجيل الدخول أولاً" : "You must be logged in",
  }

  const handleSubmit = async () => {
    const trimmedTeamName = teamName.trim()

    if (!id || !tournament || !trimmedTeamName) {
      setSubmitError(labels.invalidTournament)
      return
    }

    if (!isPlayer) {
      setSubmitError(labels.noPermission)
      return
    }

    const tournamentId = Number(id)

    if (!Number.isFinite(tournamentId)) {
      setSubmitError(labels.invalidTournament)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const createdTeam = await createTeam({
        name: trimmedTeamName,
        tournamentId,
      })

      if (createdTeam.status === 401) {
        setSubmitError(labels.loginRequired)
        return
      }

      if (createdTeam.status === 403) {
        setSubmitError(labels.noPermission)
        return
      }

      if (createdTeam.status || !createdTeam.data?.id) {
        setSubmitError(createdTeam.message || labels.invalidTournament)
        return
      }

      const joinResult = await joinTournament(createdTeam.data.id, tournamentId)

      if (joinResult.status === 401) {
        setSubmitError(labels.loginRequired)
        return
      }

      if (joinResult.status === 403) {
        setSubmitError(labels.noPermission)
        return
      }

      if (joinResult.status) {
        setSubmitError(joinResult.message || labels.invalidTournament)
        return
      }

      router.push(`/tournaments/${id}?joined=1`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : labels.invalidTournament)
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasHydrated || tournamentLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AppShell>
    )
  }

  if (tournamentError || !tournament) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-sm text-destructive">
            {tournamentError?.message || labels.invalidTournament}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/tournaments">{t("tournamentJoin.back")}</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href={`/tournaments/${id}`}>
            <ArrowLeft className="h-4 w-4 icon-arrow-back" />
            {t("tournamentJoin.back")}
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t("tournamentJoin.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {tournament.name[isArabic ? "ar" : "en"] || tournament.name.en || tournament.name.ar}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("tournamentJoin.profileTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("profile.fullName")}</Label>
                <div className="rounded-lg bg-muted px-3 py-2">
                  {user.fullName || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("auth.email")}</Label>
                <div className="rounded-lg bg-muted px-3 py-2">
                  {user.email || "-"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("tournamentJoin.teamTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">{labels.teamName}</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder={labels.teamPlaceholder}
                />
              </div>

              <p className="text-sm text-muted-foreground">{labels.joinHint}</p>

              {submitError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              <Button
                className="w-full"
                disabled={submitting || teamName.trim().length === 0}
                onClick={handleSubmit}
              >
                {submitting ? t("common.loading") : t("tournamentDetail.joinCta")}
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{labels.successRoute}</span>
            </div>
          </div>
        </div>
      </div>

      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        cancelHref="/"
      />
    </AppShell>
  )
}
