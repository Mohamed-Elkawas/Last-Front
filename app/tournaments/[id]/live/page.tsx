"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trophy, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AppShell } from "@/components/layout/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslate } from "@/hooks/use-translate"

const currentMatches = [
  {
    id: 1,
    team1: { name: "Team Alpha", avatar: "A" },
    team2: { name: "Team Beta", avatar: "B" },
    status: "in-progress",
  },
  {
    id: 2,
    team1: { name: "Team Gamma", avatar: "G" },
    team2: { name: "Team Delta", avatar: "D" },
    status: "in-progress",
  },
]

const upcomingMatches = [
  {
    id: 3,
    team1: { key: "w1" as const, avatar: "?" },
    team2: { key: "w2" as const, avatar: "?" },
    time: "15:00",
    round: "semi" as const,
  },
  {
    id: 4,
    team1: { key: "tbd" as const, avatar: "?" },
    team2: { key: "tbd" as const, avatar: "?" },
    time: "17:00",
    round: "final" as const,
  },
]

const previousResults = [
  {
    id: 5,
    team1: { name: "Team Alpha", score: 3, avatar: "A" },
    team2: { name: "Team Echo", score: 1, avatar: "E" },
    round: "quarter" as const,
  },
  {
    id: 6,
    team1: { name: "Team Beta", score: 2, avatar: "B" },
    team2: { name: "Team Foxtrot", score: 0, avatar: "F" },
    round: "quarter" as const,
  },
  {
    id: 7,
    team1: { name: "Team Gamma", score: 4, avatar: "G" },
    team2: { name: "Team Hotel", score: 2, avatar: "H" },
    round: "quarter" as const,
  },
  {
    id: 8,
    team1: { name: "Team Delta", score: 1, avatar: "D" },
    team2: { name: "Team India", score: 0, avatar: "I" },
    round: "quarter" as const,
  },
]

const leaderboard = [
  {
    rank: "01",
    team: "Team Alpha",
    matches: 5,
    goals: 12,
    assists: 8,
    goalDifference: 6,
    points: 13,
  },
  {
    rank: "02",
    team: "Team Beta",
    matches: 5,
    goals: 10,
    assists: 7,
    goalDifference: 4,
    points: 11,
  },
  {
    rank: "03",
    team: "Team Gamma",
    matches: 5,
    goals: 9,
    assists: 6,
    goalDifference: 3,
    points: 10,
  },
  {
    rank: "04",
    team: "Team Delta",
    matches: 5,
    goals: 8,
    assists: 5,
    goalDifference: 1,
    points: 8,
  },
  {
    rank: "05",
    team: "Team Echo",
    matches: 5,
    goals: 6,
    assists: 4,
    goalDifference: -1,
    points: 6,
  },
]

const bracketData = {
  quarterFinals: [
    { team1: "Team Alpha", team2: "Team Echo" },
    { team1: "Team Beta", team2: "Team Foxtrot" },
    { team1: "Team Gamma", team2: "Team Hotel" },
    { team1: "Team Delta", team2: "Team India" },
  ],
  semiFinals: [
    { team1: "Team Alpha", team2: "Team Beta" },
    { team1: "Team Gamma", team2: "Team Delta" },
  ],
  final: { team1: "TBD", team2: "TBD" },
}

type RoundKey = "quarter" | "semi" | "final"

function roundLabel(t: (key: string) => string, round: RoundKey) {
  switch (round) {
    case "quarter":
      return t("tournamentLive.roundQuarter")
    case "semi":
      return t("tournamentLive.roundSemi")
    case "final":
      return t("tournamentLive.roundFinal")
    default:
      return round
  }
}

function bracketTeamLabel(t: (key: string) => string, name: string) {
  return name === "TBD" ? t("tournamentLive.tbd") : name
}

export default function TournamentLivePage() {
  const { t } = useTranslate()
  const [activeTab, setActiveTab] = useState("matches")

  const tournament = useMemo(
    () => ({
      name: t("tournamentLive.heroName"),
      date: t("tournamentLive.heroDate"),
      location: t("tournamentLive.heroLocation"),
      prize: t("tournamentLive.heroPrize"),
      pointsReward: 500,
    }),
    [t],
  )

  const upcomingTeamLabel = (key: "w1" | "w2" | "tbd") => {
    if (key === "w1") return t("tournamentLive.demoWinnerMatch1")
    if (key === "w2") return t("tournamentLive.demoWinnerMatch2")
    return t("tournamentLive.tbd")
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="h-4 w-4 icon-arrow-back" /> {t("tournamentLive.back")}
          </Link>
        </Button>

        <Card className="mb-8 overflow-hidden bg-card">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-start">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-white/20 text-white hover:bg-white/20">{t("tournamentLive.ongoing")}</Badge>
                  <span className="text-white/80">{tournament.date}</span>
                </div>
                <h1 className="mt-2 text-3xl font-bold">{tournament.name}</h1>
                <p className="mt-1 text-white/80">{tournament.location}</p>
              </div>
              <div className="flex flex-wrap gap-6 md:justify-end">
                <div className="text-center md:text-end">
                  <p className="text-sm text-white/80">{t("tournamentLive.prizePool")}</p>
                  <p className="text-2xl font-bold">{tournament.prize}</p>
                </div>
                <div className="text-center md:text-end">
                  <p className="text-sm text-white/80">{t("tournamentLive.points")}</p>
                  <p className="text-2xl font-bold">+{tournament.pointsReward}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="matches">{t("tournamentLive.tabMatches")}</TabsTrigger>
            <TabsTrigger value="bracket">{t("tournamentLive.tabBracket")}</TabsTrigger>
            <TabsTrigger value="leaderboard">{t("tournamentLive.tabLeaderboard")}</TabsTrigger>
            <TabsTrigger value="points">{t("tournamentLive.tabPoints")}</TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>{t("tournamentLive.inProgressTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {currentMatches.map((match) => (
                  <div key={match.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                    <div className="mb-3">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        {t("tournamentLive.inProgressBadge")}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {match.team1.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-semibold">{match.team1.name}</span>
                      </div>
                      <span className="shrink-0 text-2xl font-bold text-muted-foreground">
                        {t("tournamentLive.scorePending")}
                      </span>
                    </div>

                    <div className="my-3 flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("tournamentLive.versusDisplay")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-muted">{match.team2.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="truncate font-semibold">{match.team2.name}</span>
                      </div>
                      <span className="shrink-0 text-2xl font-bold text-muted-foreground">
                        {t("tournamentLive.scorePending")}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle>{t("tournamentLive.upcomingTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {upcomingMatches.map((match) => (
                  <div key={match.id} className="rounded-xl border bg-muted/30 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">{roundLabel(t, match.round)}</Badge>
                      <span className="text-sm text-muted-foreground">{match.time}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-muted text-xs">{match.team1.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{upcomingTeamLabel(match.team1.key)}</span>
                      </div>
                      <span className="shrink-0 text-muted-foreground">{t("tournamentLive.versus")}</span>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="truncate font-medium">{upcomingTeamLabel(match.team2.key)}</span>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-muted text-xs">{match.team2.avatar}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle>{t("tournamentLive.previousTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {previousResults.map((match) => (
                  <div key={match.id} className="rounded-xl border p-4">
                    <Badge variant="secondary" className="mb-2">
                      {roundLabel(t, match.round)}
                    </Badge>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-xs text-primary">
                            {match.team1.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`truncate ${match.team1.score > match.team2.score ? "font-bold" : ""}`}
                        >
                          {match.team1.name}
                        </span>
                      </div>
                      <span className="shrink-0 font-bold" dir="ltr">
                        {match.team1.score} - {match.team2.score}
                      </span>
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`truncate ${match.team2.score > match.team1.score ? "font-bold" : ""}`}
                        >
                          {match.team2.name}
                        </span>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-muted text-xs">{match.team2.avatar}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bracket">
            <Card className="overflow-x-auto bg-card">
              <CardHeader>
                <CardTitle>{t("tournamentLive.bracketTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex min-w-[800px] items-center justify-center gap-8 py-4">
                  <div className="space-y-4">
                    <h3 className="text-center text-sm font-semibold text-muted-foreground">
                      {t("tournamentLive.quarter")}
                    </h3>
                    {bracketData.quarterFinals.map((match, i) => (
                      <div key={i} className="w-48 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{match.team1}</span>
                        </div>
                        <div className="my-2 flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("tournamentLive.versusDisplay")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{match.team2}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex h-[400px] flex-col justify-around">
                    <div className="h-16 w-8 border-e-2 border-t-2 border-border" />
                    <div className="h-16 w-8 border-b-2 border-e-2 border-border" />
                    <div className="h-16 w-8 border-e-2 border-t-2 border-border" />
                    <div className="h-16 w-8 border-b-2 border-e-2 border-border" />
                  </div>

                  <div className="space-y-24">
                    <h3 className="text-center text-sm font-semibold text-muted-foreground">
                      {t("tournamentLive.semi")}
                    </h3>
                    {bracketData.semiFinals.map((match, i) => (
                      <div key={i} className="w-48 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{match.team1}</span>
                        </div>
                        <div className="my-2 flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("tournamentLive.versusDisplay")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{match.team2}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex h-[300px] flex-col justify-around">
                    <div className="h-24 w-8 border-e-2 border-t-2 border-border" />
                    <div className="h-24 w-8 border-b-2 border-e-2 border-border" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-center text-sm font-semibold text-muted-foreground">
                      {t("tournamentLive.final")}
                    </h3>
                    <div className="w-48 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-3">
                      <div className="mb-2 flex justify-center">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {bracketTeamLabel(t, bracketData.final.team1)}
                        </span>
                      </div>
                      <div className="my-2 flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("tournamentLive.versusDisplay")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {bracketTeamLabel(t, bracketData.final.team2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {t("tournamentLive.leaderboardTitle")}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[950px]">
                    <div className="mb-3 grid grid-cols-7 gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <div>{t("tournamentLive.rankCol")}</div>
                      <div className="text-start">{t("tournamentLive.teamCol")}</div>
                      <div>{t("tournamentLive.matchesCol")}</div>
                      <div>{t("tournamentLive.goalsCol")}</div>
                      <div>{t("tournamentLive.assistsCol")}</div>
                      <div>{t("tournamentLive.gdCol")}</div>
                      <div>{t("tournamentLive.ptsCol")}</div>
                    </div>

                    <div className="space-y-3">
                      {leaderboard.map((item, index) => (
                        <div
                          key={item.rank}
                          className={`grid grid-cols-7 items-center gap-3 rounded-xl border px-4 py-4 shadow-sm transition-colors hover:bg-accent/40 ${
                            index === 0
                              ? "border-yellow-300 bg-yellow-50"
                              : index === 1
                                ? "border-slate-200 bg-slate-50"
                                : index === 2
                                  ? "border-amber-200 bg-amber-50"
                                  : "bg-background"
                          }`}
                        >
                          <div className="text-center text-2xl font-extrabold">{item.rank}</div>

                          <div className="text-start text-lg font-semibold">{item.team}</div>

                          <div className="text-center text-lg font-bold">{item.matches}</div>

                          <div className="text-center text-lg font-bold">{item.goals}</div>

                          <div className="text-center text-lg font-bold">{item.assists}</div>

                          <div className="text-center text-lg font-bold" dir="ltr">
                            {item.goalDifference}
                          </div>

                          <div className="text-center text-lg font-bold text-primary">{item.points}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  {t("tournamentLive.pointsGuideTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border bg-accent/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("tournamentLive.winnerPts")}</p>
                        <p className="text-2xl font-bold text-primary">{t("tournamentLive.ptsWinnerBonus")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-accent/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("tournamentLive.runnerPts")}</p>
                        <p className="text-2xl font-bold text-primary">{t("tournamentLive.ptsRunnerBonus")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-accent/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-700">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("tournamentLive.thirdPts")}</p>
                        <p className="text-2xl font-bold text-primary">{t("tournamentLive.ptsThirdBonus")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("tournamentLive.winPts")}</p>
                        <p className="text-2xl font-bold text-primary">{t("tournamentLive.ptsWinBonus")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("tournamentLive.drawPts")}</p>
                        <p className="text-2xl font-bold text-primary">{t("tournamentLive.ptsDrawBonus")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        <Star className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("tournamentLive.joinPts")}</p>
                        <p className="text-2xl font-bold text-primary">{t("tournamentLive.ptsJoinBonus")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-muted/50 p-4">
                  <h4 className="font-semibold">{t("tournamentLive.pointsHowTitle")}</h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>{t("tournamentLive.pointsHow1")}</li>
                    <li>{t("tournamentLive.pointsHow2")}</li>
                    <li>{t("tournamentLive.pointsHow3")}</li>
                    <li>{t("tournamentLive.pointsHow4")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
