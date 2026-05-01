"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Medal,
  ShieldAlert,
  Trophy,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useOwnerTournamentsStore } from "@/lib/owner-tournaments-store"
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

export default function CompleteTournamentPage() {
  const router = useRouter()
  const params = useParams()
  const tournamentId = String(params.id)

  const { language, hasHydrated } = useAppTranslations()
  const isArabic = language === "ar"

  const completeTournament = useOwnerTournamentsStore(
    (state) => state.completeTournament,
  )

  const tournament = useOwnerTournamentsStore((state) =>
    state.tournaments.find((item) => item.id === tournamentId),
  )

  const draw = useTournamentDrawStore((state) =>
    state.getDrawByTournamentId(tournamentId),
  )

  const labels = {
    back: isArabic ? "العودة لإدارة البطولة" : "Back to workspace",
    title: isArabic ? "إنهاء البطولة" : "Complete Tournament",
    subtitle: isArabic
      ? "راجع النتائج النهائية واعتمد الفائز قبل إغلاق البطولة."
      : "Review final standings and confirm the winner before closing the tournament.",
    noDraw: isArabic ? "لم يتم إنشاء القرعة بعد" : "No draw generated yet",
    noMatches: isArabic
      ? "لا توجد مباريات مكتملة أو معتمدة بعد"
      : "No completed or locked matches yet",
    winner: isArabic ? "الفائز بالبطولة" : "Tournament Winner",
    points: isArabic ? "نقاط" : "Points",
    played: isArabic ? "لعب" : "Played",
    goals: isArabic ? "الأهداف" : "Goals",
    finish: isArabic ? "اعتماد وإنهاء البطولة" : "Finalize Tournament",
    completed: isArabic ? "البطولة منتهية بالفعل" : "Tournament already completed",
    standings: isArabic ? "الترتيب النهائي" : "Final Standings",
    team: isArabic ? "الفريق" : "Team",
    pts: isArabic ? "نقاط" : "PTS",
    gd: isArabic ? "فرق" : "GD",
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
          (match.status === "completed" || match.status === "locked") &&
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

  const winner = standings[0]
  const hasResults = standings.some((row) => row.played > 0)
  const isCompleted = tournament?.status === "completed"

  const handleComplete = () => {
    if (!winner) return

    completeTournament(tournamentId)
    router.push(`/owner/tournaments/${tournamentId}`)
  }

  if (!hasHydrated) return null

  return (
    <AppShell showNavbar={false}>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Button asChild variant="ghost" className="mb-4 px-0">
          <Link href={`/owner/tournaments/${tournamentId}`}>
            {isArabic ? (
              <ArrowRight className="ml-2 h-4 w-4" />
            ) : (
              <ArrowLeft className="mr-2 h-4 w-4" />
            )}
            {labels.back}
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{labels.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>

        {!draw ? (
          <Card>
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <ShieldAlert className="h-10 w-10" />
              <p>{labels.noDraw}</p>
            </CardContent>
          </Card>
        ) : !hasResults ? (
          <Card>
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <ShieldAlert className="h-10 w-10" />
              <p>{labels.noMatches}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  {labels.winner}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-3xl border bg-emerald-50 p-6 text-center">
                  <Medal className="mx-auto mb-3 h-12 w-12 text-amber-600" />

                  <h2 className="text-3xl font-bold text-emerald-800">
                    {winner.teamName}
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-muted-foreground">
                        {labels.points}
                      </p>
                      <p className="text-xl font-bold">{winner.points}</p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-muted-foreground">
                        {labels.played}
                      </p>
                      <p className="text-xl font-bold">{winner.played}</p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-muted-foreground">
                        {labels.goals}
                      </p>
                      <p className="text-xl font-bold">{winner.goalsFor}</p>
                    </div>
                  </div>
                </div>

                {isCompleted ? (
                  <Badge className="w-full justify-center bg-emerald-100 py-3 text-emerald-700">
                    <CheckCircle2
                      className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                    />
                    {labels.completed}
                  </Badge>
                ) : (
                  <Button
                    onClick={handleComplete}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2
                      className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                    />
                    {labels.finish}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{labels.standings}</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="py-3 text-start">#</th>
                        <th className="py-3 text-start">{labels.team}</th>
                        <th className="py-3 text-center">{labels.played}</th>
                        <th className="py-3 text-center">{labels.gd}</th>
                        <th className="py-3 text-center">{labels.pts}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {standings.map((row, index) => (
                        <tr key={row.teamId} className="border-b last:border-0">
                          <td className="py-4 font-semibold">{index + 1}</td>
                          <td className="py-4 font-semibold">{row.teamName}</td>
                          <td className="py-4 text-center">{row.played}</td>
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
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </AppShell>
  )
}