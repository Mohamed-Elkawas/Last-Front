"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, BarChart3, Trophy } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useTournamentDrawStore } from "@/lib/tournament-draw-store"

type StandingRow = {
  teamId: string
  teamName: string
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export default function OwnerTournamentStandingsPage() {
  const params = useParams()
  const tournamentId = String(params.id)

  const { language, hasHydrated } = useAppTranslations()
  const isArabic = language === "ar"

  const draw = useTournamentDrawStore((state) =>
    state.getDrawByTournamentId(tournamentId),
  )

  const labels = {
    back: isArabic ? "العودة لإدارة البطولة" : "Back to workspace",
    title: isArabic ? "ترتيب البطولة" : "Tournament Standings",
    subtitle: isArabic
      ? "يتم حساب الترتيب تلقائيًا من نتائج المباريات."
      : "Standings are calculated automatically from match results.",
    noDraw: isArabic
      ? "لم يتم إنشاء القرعة بعد."
      : "No draw generated yet.",
    goDraw: isArabic ? "الذهاب للقرعة" : "Go to Draw",
    noResults: isArabic
      ? "لا توجد نتائج مكتملة بعد."
      : "No completed match results yet.",
    team: isArabic ? "الفريق" : "Team",
    played: isArabic ? "لعب" : "P",
    won: isArabic ? "فاز" : "W",
    draw: isArabic ? "تعادل" : "D",
    lost: isArabic ? "خسر" : "L",
    goalsFor: isArabic ? "له" : "GF",
    goalsAgainst: isArabic ? "عليه" : "GA",
    goalDifference: isArabic ? "فرق" : "GD",
    points: isArabic ? "نقاط" : "PTS",
  }

  const standings = useMemo<StandingRow[]>(() => {
    if (!draw) return []

    const table = new Map<string, StandingRow>()

    draw.teams.forEach((team) => {
      table.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      })
    })

    draw.matches
      .filter(
        (match) =>
          match.status === "completed" &&
          match.homeTeam &&
          match.awayTeam &&
          match.homeScore !== null &&
          match.awayScore !== null,
      )
      .forEach((match) => {
        const home = table.get(match.homeTeam!.id)
        const away = table.get(match.awayTeam!.id)

        if (!home || !away) return

        const homeScore = match.homeScore ?? 0
        const awayScore = match.awayScore ?? 0

        home.played += 1
        away.played += 1

        home.goalsFor += homeScore
        home.goalsAgainst += awayScore

        away.goalsFor += awayScore
        away.goalsAgainst += homeScore

        if (homeScore > awayScore) {
          home.won += 1
          home.points += 3
          away.lost += 1
        } else if (awayScore > homeScore) {
          away.won += 1
          away.points += 3
          home.lost += 1
        } else {
          home.draw += 1
          away.draw += 1
          home.points += 1
          away.points += 1
        }
      })

    return Array.from(table.values())
      .map((row) => ({
        ...row,
        goalDifference: row.goalsFor - row.goalsAgainst,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) {
          return b.goalDifference - a.goalDifference
        }
        return b.goalsFor - a.goalsFor
      })
  }, [draw])

  const hasCompletedMatches = draw?.matches.some(
    (match) => match.status === "completed",
  )

  if (!hasHydrated) return null

  return (
    <AppShell showNavbar={false}>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                {labels.title}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {!hasCompletedMatches ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                  {labels.noResults}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="py-3 text-start">#</th>
                        <th className="py-3 text-start">{labels.team}</th>
                        <th className="py-3 text-center">{labels.played}</th>
                        <th className="py-3 text-center">{labels.won}</th>
                        <th className="py-3 text-center">{labels.draw}</th>
                        <th className="py-3 text-center">{labels.lost}</th>
                        <th className="py-3 text-center">{labels.goalsFor}</th>
                        <th className="py-3 text-center">
                          {labels.goalsAgainst}
                        </th>
                        <th className="py-3 text-center">
                          {labels.goalDifference}
                        </th>
                        <th className="py-3 text-center font-bold">
                          {labels.points}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {standings.map((row, index) => (
                        <tr key={row.teamId} className="border-b last:border-0">
                          <td className="py-4 font-medium">{index + 1}</td>
                          <td className="py-4 font-semibold">
                            {row.teamName}
                          </td>
                          <td className="py-4 text-center">{row.played}</td>
                          <td className="py-4 text-center">{row.won}</td>
                          <td className="py-4 text-center">{row.draw}</td>
                          <td className="py-4 text-center">{row.lost}</td>
                          <td className="py-4 text-center">{row.goalsFor}</td>
                          <td className="py-4 text-center">
                            {row.goalsAgainst}
                          </td>
                          <td className="py-4 text-center">
                            {row.goalDifference}
                          </td>
                          <td className="py-4 text-center font-bold">
                            {row.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </AppShell>
  )
}