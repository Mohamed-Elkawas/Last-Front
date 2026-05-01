"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  GitBranch,
  RefreshCw,
  ShieldAlert,
  Shuffle,
  Trophy,
  Users,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { listOwnerTournamentRegistrations } from "@/lib/services/tournaments.service"
import {
  type TournamentDraw,
  type TournamentDrawFormat,
  type TournamentDrawMatch,
  type TournamentDrawTeam,
  useTournamentDrawStore,
} from "@/lib/tournament-draw-store"

type TournamentPlayer = {
  id?: string
  username?: string
  isCaptain?: boolean
}

type Registration = {
  id: string
  teamName?: string
  players?: TournamentPlayer[]
  playersCount?: number
  status: string
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function chunkTeams<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function shuffleTeams<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function buildLeagueMatches(
  tournamentId: string,
  teams: TournamentDrawTeam[],
): TournamentDrawMatch[] {
  const matches: TournamentDrawMatch[] = []
  let matchNumber = 1

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      matches.push({
        id: createLocalId("match"),
        tournamentId,
        homeTeam: teams[i],
        awayTeam: teams[j],
        round: matchNumber,
        status: "scheduled",
        homeScore: null,
        awayScore: null,
        createdAt: new Date().toISOString(),
      })

      matchNumber += 1
    }
  }

  return matches
}

function buildKnockoutMatches(
  tournamentId: string,
  teams: TournamentDrawTeam[],
): TournamentDrawMatch[] {
  const matches: TournamentDrawMatch[] = []

  for (let index = 0; index < teams.length; index += 2) {
    matches.push({
      id: createLocalId("match"),
      tournamentId,
      homeTeam: teams[index] ?? null,
      awayTeam: teams[index + 1] ?? null,
      round: 1,
      status: "scheduled",
      homeScore: null,
      awayScore: null,
      createdAt: new Date().toISOString(),
    })
  }

  return matches
}

function buildGroupsKnockoutMatches(
  tournamentId: string,
  teams: TournamentDrawTeam[],
): TournamentDrawMatch[] {
  const groupSize = teams.length <= 8 ? 4 : 6
  const groups = chunkTeams(teams, groupSize)
  const matches: TournamentDrawMatch[] = []

  groups.forEach((group, groupIndex) => {
    const groupName = String.fromCharCode(65 + groupIndex)
    let round = 1

    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        matches.push({
          id: createLocalId("match"),
          tournamentId,
          homeTeam: group[i],
          awayTeam: group[j],
          round,
          groupName,
          status: "scheduled",
          homeScore: null,
          awayScore: null,
          createdAt: new Date().toISOString(),
        })

        round += 1
      }
    }
  })

  return matches
}

function buildMatches(
  tournamentId: string,
  format: TournamentDrawFormat,
  teams: TournamentDrawTeam[],
) {
  if (format === "league") {
    return buildLeagueMatches(tournamentId, teams)
  }

  if (format === "knockout") {
    return buildKnockoutMatches(tournamentId, teams)
  }

  return buildGroupsKnockoutMatches(tournamentId, teams)
}

export default function OwnerTournamentDrawPage() {
  const params = useParams()
  const tournamentId = String(params.id)

  const { language, hasHydrated } = useAppTranslations()
  const isArabic = language === "ar"

  const getDrawByTournamentId = useTournamentDrawStore(
    (state) => state.getDrawByTournamentId,
  )
  const saveDraw = useTournamentDrawStore((state) => state.saveDraw)

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TournamentDrawTeam[]>([])
  const [format, setFormat] = useState<TournamentDrawFormat>("league")
  const [draw, setDraw] = useState<TournamentDraw | null>(null)

  const generatedTeams = draw?.teams ?? []

  const labels = {
    back: isArabic ? "العودة لإدارة البطولة" : "Back to workspace",
    title: isArabic ? "إنشاء القرعة" : "Generate Draw",
    subtitle: isArabic
      ? "أنشئ قرعة البطولة من الفرق المقبولة فقط، وسيتم حفظ المباريات تلقائيًا."
      : "Generate the tournament draw using approved teams only, and matches will be saved automatically.",
    approvedTeams: isArabic ? "الفرق المقبولة" : "Approved Teams",
    noTeams: isArabic
      ? "لا توجد فرق مقبولة حتى الآن. اقبل الفرق أولًا من صفحة الطلبات."
      : "No approved teams yet. Approve teams first from team requests.",
    league: isArabic ? "دوري" : "League",
    knockout: isArabic ? "خروج مغلوب" : "Knockout",
    groupsKnockout: isArabic ? "مجموعات + خروج مغلوب" : "Groups + Knockout",
    generate: isArabic ? "إنشاء القرعة وحفظها" : "Generate & Save Draw",
    regenerate: isArabic ? "إعادة إنشاء القرعة" : "Regenerate Draw",
    drawPreview: isArabic ? "معاينة القرعة" : "Draw Preview",
    savedDraw: isArabic ? "تم حفظ القرعة" : "Saved draw",
    group: isArabic ? "مجموعة" : "Group",
    match: isArabic ? "مباراة" : "Match",
    vs: isArabic ? "ضد" : "vs",
    waiting: isArabic ? "لم يتم إنشاء القرعة بعد" : "Draw has not been generated yet",
    tournamentId: isArabic ? "معرّف البطولة" : "Tournament ID",
    loading: isArabic ? "جاري التحميل..." : "Loading...",
    matchesCreated: isArabic ? "عدد المباريات المحفوظة" : "Saved matches",
    goMatches: isArabic ? "فتح المباريات" : "Open Matches",
  }

  const load = async () => {
    setLoading(true)

    try {
      const savedDraw = getDrawByTournamentId(tournamentId)
      if (savedDraw) {
        setDraw(savedDraw)
        setFormat(savedDraw.format)
      }

      const registrations = await listOwnerTournamentRegistrations({
        tournamentId,
      })

      const approved = (registrations as Registration[])
        .filter((registration) => registration.status === "confirmed")
        .map((registration) => ({
          id: registration.id,
          name:
            registration.teamName ||
            (isArabic ? "فريق بدون اسم" : "Unnamed Team"),
          playersCount:
            registration.playersCount ?? registration.players?.length ?? 0,
        }))

      setTeams(approved)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId])

  const canGenerate = teams.length >= 2

  const groups = useMemo(() => {
    const size = generatedTeams.length <= 8 ? 4 : 6
    return chunkTeams(generatedTeams, size)
  }, [generatedTeams])

  const knockoutMatches = useMemo(() => {
    const matches: Array<[TournamentDrawTeam | null, TournamentDrawTeam | null]> =
      []

    for (let index = 0; index < generatedTeams.length; index += 2) {
      matches.push([
        generatedTeams[index] ?? null,
        generatedTeams[index + 1] ?? null,
      ])
    }

    return matches
  }, [generatedTeams])

  const handleGenerate = () => {
    if (!canGenerate) return

    const randomizedTeams = shuffleTeams(teams)
    const matches = buildMatches(tournamentId, format, randomizedTeams)

    const newDraw: TournamentDraw = {
      tournamentId,
      format,
      teams: randomizedTeams,
      matches,
      createdAt: new Date().toISOString(),
    }

    saveDraw(newDraw)
    setDraw(newDraw)
  }

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

            <p className="mt-1 text-xs text-muted-foreground">
              {labels.tournamentId}: {tournamentId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {draw ? (
              <Button asChild variant="outline">
                <Link href={`/owner/tournaments/${tournamentId}/matches`}>
                  <CalendarDays
                    className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                  />
                  {labels.goMatches}
                </Link>
              </Button>
            ) : null}

            <Button
              disabled={!canGenerate}
              onClick={handleGenerate}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {draw ? (
                <RefreshCw
                  className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                />
              ) : (
                <Shuffle
                  className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                />
              )}
              {draw ? labels.regenerate : labels.generate}
            </Button>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  {labels.approvedTeams}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">
                    {labels.loading}
                  </p>
                ) : teams.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <ShieldAlert className="h-4 w-4" />
                      {labels.noTeams}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team, index) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between rounded-xl border p-3"
                      >
                        <div>
                          <p className="font-medium">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {team.playersCount}{" "}
                            {isArabic ? "لاعبين" : "players"}
                          </p>
                        </div>

                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-emerald-600" />
                  {isArabic ? "نظام القرعة" : "Draw Format"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {[
                  ["league", labels.league],
                  ["knockout", labels.knockout],
                  ["groups_knockout", labels.groupsKnockout],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFormat(value as TournamentDrawFormat)
                      setDraw(null)
                    }}
                    className={`w-full rounded-xl border p-4 text-start transition ${
                      format === value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-border bg-background hover:bg-muted/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                {labels.drawPreview}

                {draw ? (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {labels.savedDraw}
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {generatedTeams.length === 0 ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed text-center text-muted-foreground">
                  {labels.waiting}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                    {labels.matchesCreated}:{" "}
                    <span className="font-semibold text-foreground">
                      {draw?.matches.length ?? 0}
                    </span>
                  </div>

                  {format === "league" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {generatedTeams.map((team, index) => (
                        <div key={team.id} className="rounded-xl border p-4">
                          <p className="text-xs text-muted-foreground">
                            #{index + 1}
                          </p>
                          <p className="font-semibold">{team.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : format === "knockout" ? (
                    <div className="space-y-3">
                      {knockoutMatches.map(([first, second], index) => (
                        <div key={index} className="rounded-xl border p-4">
                          <p className="mb-2 text-xs text-muted-foreground">
                            {labels.match} {index + 1}
                          </p>

                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold">
                              {first?.name || (isArabic ? "انتظار" : "Bye")}
                            </p>
                            <Badge>{labels.vs}</Badge>
                            <p className="font-semibold">
                              {second?.name || (isArabic ? "انتظار" : "Bye")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {groups.map((group, index) => (
                        <div key={index} className="rounded-xl border p-4">
                          <h3 className="mb-3 font-semibold">
                            {labels.group} {String.fromCharCode(65 + index)}
                          </h3>

                          <div className="space-y-2">
                            {group.map((team) => (
                              <div
                                key={team.id}
                                className="rounded-lg bg-muted/50 px-3 py-2 text-sm"
                              >
                                {team.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </AppShell>
  )
}