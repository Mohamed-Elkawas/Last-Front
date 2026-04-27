"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trophy, MapPin, Calendar, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AppShell } from "@/components/layout/app-shell"
import { useTranslate } from "@/hooks/use-translate"
import { useTournamentSummaries } from "@/hooks/use-tournaments"
import type { TournamentStatus } from "@/lib/types/tournament"

export default function TournamentsPage() {
  const { t, language } = useTranslate()
  const { tournaments, loading } = useTournamentSummaries()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const statusFilters = useMemo(
    () => [
      { value: "All", label: t("tournaments.all") },
      { value: "Open", label: t("tournaments.open") },
      { value: "Full", label: t("tournaments.full") },
      { value: "Completed", label: t("tournaments.completed") },
    ],
    [t]
  )

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.name[language].toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.venueName[language].toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All" || tournament.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case "open":
        return "bg-primary text-primary-foreground"
      case "full":
        return "bg-yellow-500 text-white"
      case "completed":
        return "bg-muted text-muted-foreground"
    }
  }

  const statusLabel = (status: TournamentStatus) => {
    if (status === "open") return t("tournaments.open")
    if (status === "full") return t("tournaments.full")
    return t("tournaments.completed")
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("tournaments.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("tournaments.subtitle")}</p>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("tournaments.searchPlaceholder")}
              className="ps-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={tournament.imageUrl}
                  alt={tournament.name[language]}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className={`absolute end-3 top-3 ${getStatusColor(tournament.status)}`}>
                  {statusLabel(tournament.status)}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-foreground">{tournament.name[language]}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {tournament.venueName[language]}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {tournament.scheduleLabel[language]}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("tournaments.teams")}</span>
                    <span className="font-medium">
                      {tournament.teamsJoined}/{tournament.maxTeams}
                    </span>
                  </div>
                  <Progress value={(tournament.teamsJoined / tournament.maxTeams) * 100} className="mt-2 h-2" />
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div>
                    <span className="text-lg font-bold text-primary">{tournament.entryFeePerTeam}</span>
                    <span className="text-sm text-muted-foreground"> {t("tournaments.priceUnit")}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={tournament.status === "open" ? "default" : "secondary"}
                    disabled={tournament.status !== "open"}
                    asChild={tournament.status === "open"}
                  >
                    {tournament.status === "open" ? (
                      <Link href={`/tournaments/${tournament.id}`}>{t("tournaments.viewDetails")}</Link>
                    ) : tournament.status === "full" ? (
                      <span>{t("tournaments.full")}</span>
                    ) : (
                      <span>{t("tournaments.completed")}</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{t("tournaments.noResultsTitle")}</h3>
            <p className="mt-2 text-muted-foreground">{t("tournaments.noResultsDescription")}</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
