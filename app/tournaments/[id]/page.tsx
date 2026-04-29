"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Trophy,
  Users,
  Star,
  Medal,
  Target,
} from "lucide-react"

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

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : undefined

  const { tournament, loading } = useTournamentDetail(id)
  const { t, language } = useTranslate()
  const { canProceed } = useRequireAuth()

  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // 🔥 i18n helper
  function getText(value: any) {
    if (!value) return "-"
    if (typeof value === "string") return value
    return value[language] || value.en || value.ar || "-"
  }

  // 🛡️ safe values
  const safeJoined = tournament?.teamsJoined || 0
  const safeMax = tournament?.maxTeams || 1

  const progress = (safeJoined / safeMax) * 100
  const spotsLeft = safeMax - safeJoined

  const tournamentStatusLabel = (status: TournamentStatus) => {
    if (status === "open") return t("tournaments.open")
    if (status === "full") return t("tournaments.full")
    return t("tournaments.completed")
  }

  const handleJoin = () => {
    if (!id) return

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
          <p className="text-sm text-muted-foreground">
            {t("common.loading")}
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* Back */}
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="h-4 w-4" />
            {t("tournamentDetail.back")}
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* MAIN */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero */}
            <div className="relative h-64 overflow-hidden rounded-xl sm:h-80">
              <Image
                src={tournament.imageUrl}
                alt={getText(tournament.name)}
                fill
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              <div className="absolute bottom-4 start-4 end-4 text-white">
                <Badge className="mb-2">
                  {tournamentStatusLabel(tournament.status)}
                </Badge>

                <h1 className="text-2xl font-bold sm:text-3xl">
                  {getText(tournament.name)}
                </h1>

                <div className="mt-2 flex items-center gap-4 text-white/80">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {getText(tournament.venueName)}
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {getText(tournament.startDateLabel)}
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>{t("tournamentDetail.aboutTitle")}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <Badge variant="secondary">
                  {getText(tournament.formatLabel)}
                </Badge>

                <p className="text-muted-foreground">
                  {getText(tournament.description)}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBox
                    label={t("tournamentDetail.startDate")}
                    value={getText(tournament.startDateLabel)}
                  />

                  <InfoBox
                    label={t("tournamentDetail.endDate")}
                    value={getText(tournament.endDateLabel)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prizes */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trophy className="inline mr-2" />
                  {t("tournamentDetail.prizesTitle")}
                </CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 sm:grid-cols-2">
                <PrizeItem label={t("tournamentDetail.firstPlace")} value={tournament.prize.first} />
                <PrizeItem label={t("tournamentDetail.secondPlace")} value={tournament.prize.second} />
                <PrizeItem label={t("tournamentDetail.bestPlayer")} value={tournament.prize.bestPlayer} />
                <PrizeItem label={t("tournamentDetail.bestGoalkeeper")} value={tournament.prize.bestGoalkeeper} />
              </CardContent>
            </Card>

            {/* Points */}
            <Card>
              <CardHeader>
                <CardTitle>{t("tournamentDetail.pointsTitle")}</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 sm:grid-cols-3 text-center">
                <PointItem value={tournament.pointsEarned.participation} label={t("tournamentDetail.participation")} />
                <PointItem value={tournament.pointsEarned.runnerUp} label={t("tournamentDetail.runnerUp")} />
                <PointItem value={tournament.pointsEarned.winner} label={t("tournamentDetail.winner")} />
              </CardContent>
            </Card>

            {/* Teams */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("tournamentDetail.registeredTeams")} ({tournament.registeredTeams.length})
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {tournament.registeredTeams.map((team: any, i: number) => (
                  <div key={i} className="flex justify-between border p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{getText(team.name)}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.players} players
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={team.captain.avatar || undefined} />
                        <AvatarFallback>
                          {team.captain.username?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      @{team.captain.username}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">

                <p className="text-sm text-muted-foreground">
                  {t("tournamentDetail.registrationFee")}
                </p>

                <p className="text-3xl font-bold text-primary">
                  {tournament.entryFeePerTeam.toLocaleString()} {t("common.egp")}
                </p>

                <p className="text-sm text-muted-foreground">
                  {t("tournamentDetail.perTeam")}
                </p>

                {/* progress */}
                <div className="mt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("common.teamsJoined")}
                    </span>
                    <span className="font-medium">
                      {safeJoined}/{safeMax}
                    </span>
                  </div>

                  <Progress value={progress} className="mt-2 h-2" />

                  <p className="mt-2 text-sm text-muted-foreground">
                    {spotsLeft > 0
                      ? `${spotsLeft} ${t("tournamentDetail.spotsRemaining")}`
                      : t("tournaments.full")}
                  </p>
                </div>

                <Button
                  className="w-full mt-5"
                  size="lg"
                  disabled={tournament.status !== "open"}
                  onClick={handleJoin}
                >
                  {t("tournamentDetail.joinCta")}
                </Button>

                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    {t("tournamentDetail.footnote")}
                  </p>
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

/* reusable */

function PrizeItem({ label, value }: any) {
  return (
    <div className="border p-4 rounded-xl">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value} EGP</p>
    </div>
  )
}

function PointItem({ value, label }: any) {
  return (
    <div className="bg-accent p-4 rounded-lg">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  )
}

function InfoBox({ label, value }: any) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
      <Calendar className="h-5 w-5 text-primary" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}