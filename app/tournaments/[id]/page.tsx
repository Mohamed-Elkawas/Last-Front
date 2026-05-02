"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, Trophy, Users } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslate } from "@/hooks/use-translate"
import { useTournamentDetail } from "@/hooks/use-tournaments"
import { useRequireAuth } from "@/lib/auth/require-auth"

function formatDate(value: string, locale: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getStatusLabel(status: string, isArabic: boolean, t: (key: string) => string) {
  const normalized = status.toLowerCase()

  if (normalized === "open" || normalized === "full" || normalized === "completed") {
    return t(`tournaments.${normalized}`)
  }

  if (normalized === "live") {
    return t("tournaments.live")
  }

  if (normalized === "draft") {
    return isArabic ? "مسودة" : "Draft"
  }

  if (normalized === "closed") {
    return isArabic ? "مغلقة" : "Closed"
  }

  if (normalized === "cancelled") {
    return isArabic ? "ملغاة" : "Cancelled"
  }

  return status || "-"
}

export default function TournamentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { t, language, isArabic } = useTranslate()
  const { canProceed } = useRequireAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined

  const { tournament, loading, error } = useTournamentDetail(id)

  const labels = {
    notFound: isArabic ? "البطولة غير موجودة" : "Tournament not found",
    description: isArabic ? "الوصف" : "Description",
    type: isArabic ? "النوع" : "Type",
    price: isArabic ? "السعر" : "Price",
    prize: isArabic ? "الجائزة" : "Prize",
    fieldId: isArabic ? "معرّف الملعب" : "Field ID",
    teams: isArabic ? "عدد الفرق" : "Teams",
    joined: isArabic ? "المنضمّون" : "Joined",
    joinedBanner: isArabic ? "تم الانضمام إلى البطولة بنجاح" : "You joined the tournament successfully",
  }

  const handleJoin = () => {
    if (!id) return

    if (!canProceed("tournament_join", { tournamentId: id })) {
      setShowAuthDialog(true)
      return
    }

    router.push(`/tournaments/${id}/join`)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      </AppShell>
    )
  }

  if (!tournament) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Button variant="ghost" className="mb-6 gap-2" asChild>
            <Link href="/tournaments">
              <ArrowLeft className="h-4 w-4" />
              {t("tournamentDetail.back")}
            </Link>
          </Button>
          <Card>
            <CardContent className="p-8">
              <h1 className="text-2xl font-semibold">{labels.notFound}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {error?.message || labels.notFound}
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  const locale = language === "ar" ? "ar-EG" : "en-US"
  const joinedBanner = searchParams.get("joined") === "1"

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="h-4 w-4" />
            {t("tournamentDetail.back")}
          </Link>
        </Button>

        {joinedBanner ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {labels.joinedBanner}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="secondary">{getStatusLabel(tournament.status, isArabic, t)}</Badge>
                    <h1 className="mt-3 text-3xl font-bold">
                      {tournament.name[language] || tournament.name.en || tournament.name.ar}
                    </h1>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("tournamentDetail.startDate")}</p>
                      <p className="font-medium">{formatDate(tournament.startDate, locale)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("tournamentDetail.endDate")}</p>
                      <p className="font-medium">{formatDate(tournament.endDate, locale)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBox label={labels.type} value={tournament.type || "-"} icon={<Trophy className="h-5 w-5 text-primary" />} />
                  <InfoBox label={labels.fieldId} value={tournament.fieldId !== null ? String(tournament.fieldId) : "-"} icon={<MapPin className="h-5 w-5 text-primary" />} />
                  <InfoBox label={labels.teams} value={String(tournament.numberOfTeams)} icon={<Users className="h-5 w-5 text-primary" />} />
                  <InfoBox label={labels.joined} value={String(tournament.teamsJoined)} icon={<Users className="h-5 w-5 text-primary" />} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{labels.description}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {tournament.description[language] || tournament.description.en || tournament.description.ar || "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-sm text-muted-foreground">{labels.price}</p>
                  <p className="text-3xl font-bold text-primary">
                    {tournament.price} {t("common.egp")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{labels.prize}</p>
                  <p className="font-medium">
                    {tournament.prize[language] || tournament.prize.en || tournament.prize.ar || "-"}
                  </p>
                </div>

                <Button className="w-full" onClick={handleJoin}>
                  {t("tournamentDetail.joinCta")}
                </Button>
              </CardContent>
            </Card>
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

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}
