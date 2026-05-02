"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Settings,
  Trophy,
  Users,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useTournamentDetail } from "@/hooks/use-tournaments"

function formatDate(value: string, locale: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export default function OwnerTournamentDetailsPage() {
  const params = useParams()
  const tournamentId = String(params.id)

  const { language, hasHydrated } = useAppTranslations()
  const { tournament, loading, error } = useTournamentDetail(tournamentId)
  const isArabic = language === "ar"

  const labels = {
    back: isArabic ? "العودة للبطولات" : "Back to tournaments",
    title: isArabic ? "إدارة البطولة" : "Tournament Workspace",
    subtitle: isArabic
      ? "عرض تفاصيل البطولة الحية المرتبطة بالخادم."
      : "Review the live tournament details from the backend.",
    tournamentId: isArabic ? "معرّف البطولة" : "Tournament ID",
    edit: isArabic ? "إعدادات البطولة" : "Tournament Settings",
    teams: isArabic ? "الفرق" : "Teams",
    start: isArabic ? "البداية" : "Start",
    status: isArabic ? "الحالة" : "Status",
    fieldId: isArabic ? "معرّف الملعب" : "Field ID",
    notFound: isArabic ? "البطولة غير موجودة" : "Tournament not found",
    details: isArabic ? "عرض البطولة" : "View Tournament",
  }

  if (!hasHydrated || loading) {
    return null
  }

  if (!tournament) {
    return (
      <AppShell showNavbar={false}>
        <main className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-sm text-destructive">{error?.message || labels.notFound}</p>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell showNavbar={false}>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-3 px-0">
              <Link href="/owner/tournaments">
                {isArabic ? (
                  <ArrowRight className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowLeft className="mr-2 h-4 w-4" />
                )}
                {labels.back}
              </Link>
            </Button>

            <h1 className="text-3xl font-bold tracking-tight">
              {tournament.name[language] || tournament.name.en || tournament.name.ar}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">{labels.subtitle}</p>

            <p className="mt-1 text-xs text-muted-foreground">
              {labels.tournamentId}: {tournamentId}
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/tournaments/${tournamentId}`}>{labels.details}</Link>
            </Button>

            <Button asChild>
              <Link href={`/owner/tournaments/${tournamentId}/settings`}>
                <Settings className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {labels.edit}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.teams}</p>
                  <p className="text-2xl font-bold">
                    {tournament.teamsJoined} / {tournament.numberOfTeams}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.start}</p>
                  <p className="text-2xl font-bold">
                    {formatDate(tournament.startDate, isArabic ? "ar-EG" : "en-US")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.status}</p>
                  <p className="text-2xl font-bold">{tournament.status || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.fieldId}</p>
                  <p className="text-2xl font-bold">{tournament.fieldId ?? "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? "الوصف" : "Description"}</p>
                <p className="mt-1">
                  {tournament.description[language] || tournament.description.en || tournament.description.ar || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? "الجائزة" : "Prize"}</p>
                <p className="mt-1">
                  {tournament.prize[language] || tournament.prize.en || tournament.prize.ar || "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </AppShell>
  )
}
