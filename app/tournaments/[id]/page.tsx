"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Calendar, Trophy, Users, Star, Medal, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { useTranslate } from "@/hooks/use-translate"
import { useTournamentDetail } from "@/hooks/use-tournaments"
import { useRequireAuth } from "@/lib/auth/require-auth"
import type { TournamentStatus } from "@/lib/types/tournament"

export default function TournamentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined
  const { tournament, loading } = useTournamentDetail(id)
  const { t, language } = useTranslate()
  const { canProceed } = useRequireAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const progress = tournament ? (tournament.teamsJoined / tournament.maxTeams) * 100 : 0
  const spotsLeft = tournament ? tournament.maxTeams - tournament.teamsJoined : 0

  const tournamentStatusLabel = (status: TournamentStatus) => {
    if (status === "open") return t("tournaments.open")
    if (status === "full") return t("tournaments.full")
    return t("tournaments.completed")
  }

  const handleJoin = () => {
    if (!id) return
    
    // Guard: Check authentication
    if (!canProceed("tournament_join", { tournamentId: id })) {
      setShowAuthDialog(true)
      return
    }
    
    router.push(`/tournaments/${id}/join`)
  }

  if (loading || !tournament) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="h-4 w-4 icon-arrow-back" /> {t("tournamentDetail.back")}
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Image */}
            <div className="relative h-64 overflow-hidden rounded-xl sm:h-80">
              <Image src={tournament.imageUrl} alt={tournament.name[language]} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 start-4 end-4">
                <Badge
                  className={`mb-2 ${
                    tournament.status === "open"
                      ? "bg-primary text-primary-foreground"
                      : tournament.status === "full"
                        ? "bg-yellow-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tournamentStatusLabel(tournament.status)}
                </Badge>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{tournament.name[language]}</h1>
                <div className="mt-2 flex items-center gap-4 text-white/80">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {tournament.venueName[language]}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {tournament.startDateLabel[language]}
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("tournamentDetail.aboutTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{tournament.formatLabel[language]}</Badge>
                </div>
                <p className="text-muted-foreground">{tournament.description[language]}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("tournamentDetail.startDate")}</p>
                      <p className="font-medium">{tournament.startDateLabel[language]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("tournamentDetail.endDate")}</p>
                      <p className="font-medium">{tournament.endDateLabel[language]}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prizes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" /> {t("tournamentDetail.prizesTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500">
                      <Medal className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("tournamentDetail.firstPlace")}</p>
                      <p className="text-xl font-bold text-foreground">
                        {tournament.prize.first.toLocaleString()} {t("common.egp")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border border-gray-400/30 bg-gray-400/10 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400">
                      <Medal className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("tournamentDetail.secondPlace")}</p>
                      <p className="text-xl font-bold text-foreground">
                        {tournament.prize.second.toLocaleString()} {t("common.egp")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                      <Star className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("tournamentDetail.bestPlayer")}</p>
                      <p className="text-xl font-bold text-foreground">
                        {tournament.prize.bestPlayer.toLocaleString()} {t("common.egp")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                      <Target className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("tournamentDetail.bestGoalkeeper")}</p>
                      <p className="text-xl font-bold text-foreground">
                        {tournament.prize.bestGoalkeeper.toLocaleString()} {t("common.egp")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points Earned */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" /> {t("tournamentDetail.pointsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center rounded-lg bg-accent p-4">
                    <p className="text-2xl font-bold text-primary">{tournament.pointsEarned.participation}</p>
                    <p className="text-sm text-muted-foreground">{t("tournamentDetail.participation")}</p>
                  </div>
                  <div className="text-center rounded-lg bg-accent p-4">
                    <p className="text-2xl font-bold text-primary">{tournament.pointsEarned.runnerUp}</p>
                    <p className="text-sm text-muted-foreground">{t("tournamentDetail.runnerUp")}</p>
                  </div>
                  <div className="text-center rounded-lg bg-accent p-4">
                    <p className="text-2xl font-bold text-primary">{tournament.pointsEarned.winner}</p>
                    <p className="text-sm text-muted-foreground">{t("tournamentDetail.winner")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registered Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> {t("tournamentDetail.registeredTeams")} ({tournament.registeredTeams.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tournament.registeredTeams.map((team, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{team.name[language]}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("tournamentDetail.playersCount", { count: team.players })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={team.captain.avatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {team.captain.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">@{team.captain.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">{t("tournamentDetail.registrationFee")}</p>
                  <p className="text-3xl font-bold text-primary">
                    {tournament.entryFeePerTeam.toLocaleString()} {t("common.egp")}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("tournamentDetail.perTeam")}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("common.teamsJoined")}</span>
                    <span className="font-medium">
                      {tournament.teamsJoined}/{tournament.maxTeams}
                    </span>
                  </div>
                  <Progress value={progress} className="mt-2 h-2" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("tournamentDetail.spotsRemaining", { count: spotsLeft })}
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={tournament.status !== "open"}
                  onClick={handleJoin}
                >
                  {t("tournamentDetail.joinCta")}
                </Button>

                <Button
                  className="mt-3 w-full"
                  variant="outline"
                  size="lg"
                  asChild
                >
                  <Link href={`/tournaments/${id}/live`}>
                    {t("tournamentDetail.viewLive")}
                  </Link>
                </Button>

                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">{t("tournamentDetail.footnote")}</p>
                </div>
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
