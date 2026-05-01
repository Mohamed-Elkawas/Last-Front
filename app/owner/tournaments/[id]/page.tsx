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

export default function OwnerTournamentDetailsPage() {
  const params = useParams()
  const tournamentId = String(params.id)

  const { language, hasHydrated } = useAppTranslations()
  const isArabic = language === "ar"

  const labels = {
    back: isArabic ? "العودة للبطولات" : "Back to tournaments",
    title: isArabic ? "إدارة البطولة" : "Tournament Workspace",
    subtitle: isArabic
      ? "إدارة الفرق، القرعة، المباريات، الترتيب، وحالة البطولة."
      : "Manage teams, draw, matches, standings, and tournament status.",
    tournamentId: isArabic ? "معرّف البطولة" : "Tournament ID",
    edit: isArabic ? "تعديل البطولة" : "Edit Tournament",
    teams: isArabic ? "الفرق" : "Teams",
    matches: isArabic ? "المباريات" : "Matches",
    status: isArabic ? "الحالة" : "Status",
    draft: isArabic ? "مسودة" : "Draft",
    teamsRequests: isArabic ? "طلبات الفرق" : "Teams Requests",
    generateDraw: isArabic ? "إنشاء القرعة" : "Generate Draw",
    standings: isArabic ? "الترتيب" : "Standings",
  }

  if (!hasHydrated) return null

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
              {labels.title}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {labels.subtitle}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {labels.tournamentId}: {tournamentId}
            </p>
          </div>

          <Button asChild>
            <Link href={`/owner/tournaments/${tournamentId}/settings`}>
              <Settings className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
              {labels.edit}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {labels.teams}
                  </p>
                  <p className="text-2xl font-bold">
                    0 / 16
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
                  <p className="text-sm text-muted-foreground">
                    {labels.matches}
                  </p>
                  <p className="text-2xl font-bold">
                    0
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
                  <p className="text-sm text-muted-foreground">
                    {labels.status}
                  </p>
                  <p className="text-2xl font-bold">
                    {labels.draft}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-24 justify-start p-5">
            <Link href={`/owner/tournaments/${tournamentId}/teams`}>
              {labels.teamsRequests}
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 justify-start p-5">
            <Link href={`/owner/tournaments/${tournamentId}/draw`}>
              {labels.generateDraw}
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 justify-start p-5">
            <Link href={`/owner/tournaments/${tournamentId}/matches`}>
              {labels.matches}
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 justify-start p-5">
            <Link href={`/owner/tournaments/${tournamentId}/standings`}>
              {labels.standings}
            </Link>
          </Button>
        </section>
      </main>
    </AppShell>
  )
}