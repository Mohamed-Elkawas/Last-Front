"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Search, Trophy } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

import { useTranslate } from "@/hooks/use-translate"
import { useTournamentSummaries } from "@/hooks/use-tournaments"
import type { TournamentStatus } from "@/lib/types/tournament"

type TournamentFilter = "all" | "open" | "full" | "completed"

function getLocalizedValue(
  value: { ar?: string; en?: string } | undefined,
  language: "ar" | "en",
) {
  if (!value) return ""
  return value[language] || value.en || value.ar || ""
}

function getTournamentProgress(teamsJoined: number, maxTeams: number) {
  if (!maxTeams || maxTeams <= 0) return 0
  return Math.min(100, Math.max(0, (teamsJoined / maxTeams) * 100))
}

export default function TournamentsPage() {
  const { t, language } = useTranslate()
  const { tournaments, loading, error, reload } = useTournamentSummaries()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TournamentFilter>("all")

  const statusFilters = useMemo(
    () => [
      { value: "all" as const, label: t("tournaments.all") },
      { value: "open" as const, label: t("tournaments.open") },
      { value: "full" as const, label: t("tournaments.full") },
      { value: "completed" as const, label: t("tournaments.completed") },
    ],
    [t],
  )

  const filteredTournaments = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return tournaments.filter((tournament) => {
      const name = getLocalizedValue(tournament.name, language).toLowerCase()
      const venue = getLocalizedValue(tournament.venueName, language).toLowerCase()

      const matchesSearch =
        normalizedSearch.length === 0 ||
        name.includes(normalizedSearch) ||
        venue.includes(normalizedSearch)

      const matchesStatus =
        statusFilter === "all" || tournament.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [language, searchQuery, statusFilter, tournaments])

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case "open":
        return "bg-primary text-primary-foreground"
      case "full":
        return "bg-yellow-500 text-white"
      case "completed":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: TournamentStatus) => {
    switch (status) {
      case "open":
        return t("tournaments.open")
      case "full":
        return t("tournaments.full")
      case "completed":
        return t("tournaments.completed")
      default:
        return "-"
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-sm text-muted-foreground">
            {t("common.loading")}
          </p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">
            {t("common.somethingWentWrong")}
          </h2>
          <Button className="mt-4" onClick={reload}>
            {t("common.retry")}
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {t("tournaments.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("tournaments.subtitle")}
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 flex gap-4">
          <Input
            placeholder={t("tournaments.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => {
            const name = getLocalizedValue(tournament.name, language)
            const venue = getLocalizedValue(tournament.venueName, language)
            const schedule = getLocalizedValue(tournament.scheduleLabel, language)

            const progress = getTournamentProgress(
              tournament.teamsJoined,
              tournament.maxTeams,
            )

            return (
              <Card key={tournament.id} className="overflow-hidden">

                {/* Image */}
                <div className="relative h-48">
                  <Image
                    src={tournament.imageUrl}
                    alt={name}
                    fill
                    className="object-cover"
                  />

                  <Badge className={`absolute top-3 right-3 ${getStatusColor(tournament.status)}`}>
                    {getStatusLabel(tournament.status)}
                  </Badge>
                </div>

                <CardContent className="p-4">

                  {/* Title */}
                  <h3 className="font-semibold text-lg">{name}</h3>

                  {/* Info */}
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {venue}
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {schedule}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span>{t("tournaments.teams")}</span>
                      <span>
                        {tournament.teamsJoined}/{tournament.maxTeams}
                      </span>
                    </div>
                    <Progress value={progress} className="mt-2 h-2" />
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex justify-between items-center border-t pt-4">
                    <div>
                      <span className="text-lg font-bold text-primary">
                        {tournament.entryFeePerTeam.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {" "}{t("tournaments.priceUnit")}
                      </span>
                    </div>

                    {/* ✅ الزرار دايمًا ظاهر */}
                    <Button size="sm" asChild>
                      <Link href={`/tournaments/${tournament.id}`}>
                        {t("tournaments.viewDetails")}
                      </Link>
                    </Button>

                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}