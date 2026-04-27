"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, MapPin, Users, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppShell } from "@/components/layout/app-shell"
import { addDays, format } from "date-fns"
import { useTranslate } from "@/hooks/use-translate"
import { getDateFnsLocale } from "@/lib/i18n/date-locale"

const fields = [
  { id: "1", name: "Al Ahly Sports Club - Field A" },
  { id: "2", name: "Al Ahly Sports Club - Field B" },
  { id: "3", name: "Zamalek Arena - Main" },
  { id: "4", name: "Cairo Stadium - Field 1" },
  { id: "5", name: "Cairo Stadium - Field 2" },
]

const startTimes = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]
const endTimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]

export default function CreateMatchPage() {
  const router = useRouter()
  const { t, language } = useTranslate()
  const dateLocale = useMemo(() => getDateFnsLocale(language), [language])

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)), [])

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedField, setSelectedField] = useState("")
  const [matchType, setMatchType] = useState<"teams" | "player">("teams")
  const [playerCount, setPlayerCount] = useState(2)
  const [isLoading, setIsLoading] = useState(false)

  const isValid = Boolean(selectedDate && startTime && endTime && selectedField && startTime < endTime)

  const handleCreate = async () => {
    if (!isValid) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push("/bookings")
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 icon-arrow-back" />
            {t("matchCreate.backHome")}
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("matchCreate.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("matchCreate.subtitle")}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("matchCreate.when")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="mb-3 block text-sm font-medium text-foreground">{t("common.selectDate")}</span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.map((date) => (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`flex min-w-[80px] flex-col items-center rounded-lg border-2 p-3 transition-colors ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xs">{format(date, "EEE", { locale: dateLocale })}</span>
                      <span className="text-lg font-semibold">{format(date, "d", { locale: dateLocale })}</span>
                      <span className="text-xs">{format(date, "MMM", { locale: dateLocale })}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-2 block text-sm font-medium text-foreground">{t("matchCreate.startTime")}</span>
                  <div className="flex flex-wrap gap-2">
                    {startTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setStartTime(time)}
                        className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                          startTime === time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-2 block text-sm font-medium text-foreground">{t("matchCreate.endTime")}</span>
                  <div className="flex flex-wrap gap-2">
                    {endTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setEndTime(time)}
                        disabled={Boolean(startTime && time <= startTime)}
                        className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                          endTime === time
                            ? "border-primary bg-primary text-primary-foreground"
                            : startTime && time <= startTime
                              ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                              : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {startTime && endTime && startTime >= endTime && (
                <p className="text-sm text-destructive">{t("matchCreate.endAfterStart")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("matchCreate.where")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="mb-2 block text-sm font-medium text-foreground">{t("matchCreate.selectField")}</span>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder={t("matchCreate.fieldPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("matchCreate.whoTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setMatchType("teams")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    matchType === "teams" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {t("matchCreate.teams")}
                </button>
                <button
                  type="button"
                  onClick={() => setMatchType("player")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    matchType === "player" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {t("matchCreate.individuals")}
                </button>
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-foreground">
                  {matchType === "teams" ? t("matchCreate.countTeams") : t("matchCreate.countPlayers")}
                </span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPlayerCount(Math.max(1, playerCount - 1))}
                    disabled={playerCount <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-2xl font-bold">{playerCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPlayerCount(Math.min(22, playerCount + 1))}
                    disabled={playerCount >= 22}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" disabled={!isValid || isLoading} onClick={handleCreate}>
            {isLoading ? t("matchCreate.creating") : t("matchCreate.createMatch")}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
