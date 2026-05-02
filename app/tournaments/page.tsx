"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Calendar, Search, Trophy } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTranslate } from "@/hooks/use-translate"
import { useTournamentSummaries } from "@/hooks/use-tournaments"

type TournamentFilter = "all" | "open" | "full" | "completed"

function formatDateRange(startDate: string, endDate: string, locale: string) {
  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null

  if (!start || Number.isNaN(start.getTime())) {
    return "-"
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  if (!end || Number.isNaN(end.getTime())) {
    return formatter.format(start)
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function getStatusLabel(status: string, t: (key: string) => string, isArabic: boolean) {
  const normalized = status.toLowerCase()

  if (normalized === "open" || normalized === "full" || normalized === "completed") {
    return t(`tournaments.${normalized}`)
  }

  if (normalized === "draft") {
    return isArabic ? "مسودة" : "Draft"
  }

  if (normalized === "closed") {
    return isArabic ? "مغلقة" : "Closed"
  }

  if (normalized === "cancelled") {
    return isArabic ? "ملغاة" : "Cancelled"
  }

  if (normalized === "live") {
    return t("tournaments.live")
  }

  return status || "-"
}

export default function TournamentsPage() {
  const { t, language, isArabic } = useTranslate()
  const { tournaments, loading, error, reload } = useTournamentSummaries()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TournamentFilter>("all")

  const labels = {
    emptyTitle: isArabic ? "لا توجد بطولات" : "No tournaments found",
    emptyBody: isArabic
      ? "ستظهر البطولات هنا عند توفرها من الخادم."
      : "Tournaments will appear here once the backend returns them.",
    fieldId: isArabic ? "معرّف الملعب" : "Field ID",
    teams: isArabic ? "عدد الفرق" : "Teams",
    joined: isArabic ? "المنضمّون" : "Joined",
    price: isArabic ? "السعر" : "Price",
    prize: isArabic ? "الجائزة" : "Prize",
    type: isArabic ? "النوع" : "Type",
    retry: isArabic ? "إعادة المحاولة" : "Retry",
  }

  const filteredTournaments = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return tournaments.filter((tournament) => {
      const tournamentName = `${tournament.name.en} ${tournament.name.ar}`.toLowerCase()

      const matchesSearch =
        normalizedSearch.length === 0 || tournamentName.includes(normalizedSearch)

      const matchesStatus =
        statusFilter === "all" || tournament.status.toLowerCase() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter, tournaments])

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">{error.message}</h2>
          <Button className="mt-4" onClick={() => void reload()}>
            {labels.retry}
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("tournaments.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("tournaments.subtitle")}</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={t("tournaments.searchPlaceholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "open", "full", "completed"] as const).map((status) => (
              <Button
                key={status}
                type="button"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? t("tournaments.all") : t(`tournaments.${status}`)}
              </Button>
            ))}
          </div>
        </div>

        {filteredTournaments.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-16 text-center">
            <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">{labels.emptyTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{labels.emptyBody}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="overflow-hidden">
                <CardContent className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {tournament.name[language] || tournament.name.en || tournament.name.ar}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tournament.type || "-"}</p>
                    </div>

                    <Badge variant="secondary">{getStatusLabel(tournament.status, t, isArabic)}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(tournament.startDate, tournament.endDate, language === "ar" ? "ar-EG" : "en-US")}</span>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">{labels.price}</p>
                      <p className="font-medium">{tournament.price} {t("common.egp")}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">{labels.prize}</p>
                      <p className="font-medium">{tournament.prize[language] || tournament.prize.en || tournament.prize.ar || "-"}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">{labels.teams}</p>
                      <p className="font-medium">{tournament.numberOfTeams}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">{labels.joined}</p>
                      <p className="font-medium">{tournament.teamsJoined}</p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground">{labels.fieldId}</p>
                      <p className="font-medium">{tournament.fieldId ?? "-"}</p>
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/tournaments/${tournament.id}`}>
                      {t("tournaments.viewDetails")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
