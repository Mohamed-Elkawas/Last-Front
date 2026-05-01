"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Lock,
  Trophy,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useTournamentDrawStore } from "@/lib/tournament-draw-store"

export default function OwnerTournamentMatchesPage() {
  const params = useParams()
  const tournamentId = String(params.id)

  const { language, hasHydrated } = useAppTranslations()
  const isArabic = language === "ar"

  const draw = useTournamentDrawStore((state) =>
    state.getDrawByTournamentId(tournamentId),
  )

  const labels = {
    back: isArabic ? "العودة لإدارة البطولة" : "Back to workspace",
    title: isArabic ? "مباريات البطولة" : "Tournament Matches",
    subtitle: isArabic
      ? "تابع المباريات وسجّل النتائج واعتمد المباريات النهائية."
      : "Track matches, enter results, and finalize locked matches.",
    noDraw: isArabic
      ? "لم يتم إنشاء القرعة بعد. أنشئ القرعة أولًا."
      : "No draw generated yet. Generate the draw first.",
    goDraw: isArabic ? "الذهاب للقرعة" : "Go to Draw",
    match: isArabic ? "مباراة" : "Match",
    round: isArabic ? "الجولة" : "Round",
    group: isArabic ? "مجموعة" : "Group",
    scheduled: isArabic ? "مجدولة" : "Scheduled",
    completed: isArabic ? "مكتملة" : "Completed",
    locked: isArabic ? "معتمدة" : "Locked",
    enterResult: isArabic ? "إدخال النتيجة" : "Enter Result",
    editResult: isArabic ? "تعديل النتيجة" : "Edit Result",
    viewResult: isArabic ? "عرض النتيجة" : "View Result",
    bye: isArabic ? "انتظار" : "Bye",
    totalMatches: isArabic ? "إجمالي المباريات" : "Total Matches",
    completedMatches: isArabic ? "المباريات المكتملة" : "Completed Matches",
    lockedMatches: isArabic ? "المباريات المعتمدة" : "Locked Matches",
    score: isArabic ? "النتيجة" : "Score",
  }

  const matches = draw?.matches ?? []

  const stats = useMemo(() => {
    return {
      total: matches.length,
      completed: matches.filter(
        (match) => match.status === "completed" || match.status === "locked",
      ).length,
      locked: matches.filter((match) => match.status === "locked").length,
    }
  }, [matches])

  if (!hasHydrated) return null

  return (
    <AppShell showNavbar={false}>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-3 px-0">
              <Link href={`/owner/tournaments/${tournamentId}`}>
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
          </div>
        </div>

        {!draw ? (
          <Card>
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{labels.noDraw}</p>

              <Button asChild>
                <Link href={`/owner/tournaments/${tournamentId}/draw`}>
                  {labels.goDraw}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {labels.totalMatches}
                    </p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {labels.completedMatches}
                    </p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {labels.lockedMatches}
                    </p>
                    <p className="text-2xl font-bold">{stats.locked}</p>
                  </div>
                  <Lock className="h-5 w-5 text-emerald-600" />
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>{labels.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {matches.map((match, index) => {
                  const isCompleted =
                    match.status === "completed" || match.status === "locked"

                  const isLocked = match.status === "locked"

                  return (
                    <div key={match.id} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {labels.match} {index + 1}
                            {" · "}
                            {labels.round} {match.round}
                            {match.groupName
                              ? ` · ${labels.group} ${match.groupName}`
                              : ""}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-lg font-semibold">
                            <span>{match.homeTeam?.name || labels.bye}</span>

                            <Badge variant="outline">
                              {isCompleted
                                ? `${match.homeScore ?? 0} - ${
                                    match.awayScore ?? 0
                                  }`
                                : "VS"}
                            </Badge>

                            <span>{match.awayTeam?.name || labels.bye}</span>
                          </div>

                          {isCompleted ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {labels.score}: {match.homeScore} -{" "}
                              {match.awayScore}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={
                              isLocked
                                ? "bg-emerald-100 text-emerald-700"
                                : isCompleted
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                            }
                          >
                            {isLocked
                              ? labels.locked
                              : isCompleted
                                ? labels.completed
                                : labels.scheduled}
                          </Badge>

                          <Button asChild size="sm">
                            <Link
                              href={`/owner/tournaments/${tournamentId}/matches/${match.id}/result`}
                            >
                              {isLocked ? (
                                <Lock
                                  className={
                                    isArabic
                                      ? "ml-2 h-4 w-4"
                                      : "mr-2 h-4 w-4"
                                  }
                                />
                              ) : (
                                <Edit3
                                  className={
                                    isArabic
                                      ? "ml-2 h-4 w-4"
                                      : "mr-2 h-4 w-4"
                                  }
                                />
                              )}

                              {isLocked
                                ? labels.viewResult
                                : isCompleted
                                  ? labels.editResult
                                  : labels.enterResult}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </AppShell>
  )
}