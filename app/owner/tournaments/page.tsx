"use client"

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { PlusCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useBookingStore } from "@/lib/booking-store"
import { useOwnerTournamentsStore } from "@/lib/owner-tournaments-store"
import { countTournamentRegistrations } from "@/lib/domain/tournament/catalog-merge"
import { publishOwnerTournament } from "@/lib/services/owner-tournaments.service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
type LocalizedText = string | { en?: string; ar?: string } | null | undefined

function getLocalizedText(value: LocalizedText, language: "en" | "ar") {
  if (!value) return ""
  if (typeof value === "string") return value
  return value[language] ?? value.ar ?? value.en ?? ""
}

export default function OwnerTournamentsPage() {
  const { t, language, hasHydrated } = useAppTranslations()
  const { tournaments: ownerTournaments, endTournament } = useOwnerTournamentsStore()
  const bookings = useBookingStore((s) => s.bookings)

  const [fee, setFee] = useState("400")
  const [maxTeams, setMaxTeams] = useState("16")
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [schedule, setSchedule] = useState(language === "ar" ? "٢٨ أبريل – ٢ مايو ٢٠٢٦" : "Apr 28 – May 2, 2026")
  const [startDate, setStartDate] = useState(language === "ar" ? "٢٨ أبريل ٢٠٢٦" : "Apr 28, 2026")
  const [endDate, setEndDate] = useState(language === "ar" ? "٢ مايو ٢٠٢٦" : "May 2, 2026")
  const [endingTournament, setEndingTournament] = useState<string | null>(null)
  const [deletingTournament, setDeletingTournament] = useState<string | null>(null)

  const rows = useMemo(() => {
    return ownerTournaments.map((r) => {
      const joined = countTournamentRegistrations(bookings, r.id)
      return { record: r, joined }
    })
  }, [ownerTournaments, bookings])

  const handlePublish = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    publishOwnerTournament({
      name: { en: title.trim(), ar: title.trim() },
      description: { en: desc.trim() || "—", ar: desc.trim() || "—" },
      entryFeePerTeam: Math.max(0, Number(fee) || 0),
      maxTeams: Math.max(2, Math.min(64, Number(maxTeams) || 8)),
      scheduleLabel: { en: schedule.trim(), ar: schedule.trim() },
      startDateLabel: { en: startDate.trim(), ar: startDate.trim() },
      endDateLabel: { en: endDate.trim(), ar: endDate.trim() },
      imageUrl: "",
      venueName: {
        ar: "",
        en: ""
      },
      prize: {
        first: 0,
        second: 0,
        bestPlayer: 0,
        bestGoalkeeper: 0
      }
    })

    setTitle("")
    setDesc("")
  }

  const handleEndTournament = (tournamentId: string) => {
    endTournament(tournamentId)
    setEndingTournament(null)
  }

  const handleDeleteTournament = (tournamentId: string) => {
    // Remove tournament from store
    const { tournaments } = useOwnerTournamentsStore.getState()
    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId)
    useOwnerTournamentsStore.setState({ tournaments: updatedTournaments })
    
    // Remove related bookings
    const { bookings } = useBookingStore.getState()
    const updatedBookings = bookings.filter(b => b.kind !== "tournament" || b.tournament?.id !== tournamentId)
    useBookingStore.setState({ bookings: updatedBookings })
    
    setDeletingTournament(null)
  }

  if (!hasHydrated) return null

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          {t("ownerTournamentsPage.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("ownerTournamentsPage.subtitle")}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <PlusCircle className="h-5 w-5 text-primary" />
              {t("ownerTournamentsPage.formTitle")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("ownerTournamentsPage.formSubtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handlePublish}>
              <div className="space-y-2">
                <Label className="text-foreground">
                  {language === "ar" ? "عنوان البطولة" : "Tournament title"}
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-border bg-background text-foreground"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    {t("ownerTournamentsPage.fieldFee")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">
                    {t("ownerTournamentsPage.fieldTeams")}
                  </Label>
                  <Input
                    type="number"
                    min={2}
                    max={64}
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(e.target.value)}
                    className="border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">
                  {language === "ar" ? "وصف الجدول" : "Schedule description"}
                </Label>
                <Input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="border-border bg-background text-foreground"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    {language === "ar" ? "تاريخ البداية" : "Start date"}
                  </Label>
                  <Input
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">
                    {language === "ar" ? "تاريخ النهاية" : "End date"}
                  </Label>
                  <Input
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">
                  {language === "ar" ? "وصف البطولة" : "Tournament description"}
                </Label>
                <Textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="border-border bg-background text-foreground"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                {t("ownerTournamentsPage.publish")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("ownerTournamentsPage.listTitle")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("ownerTournamentsPage.listSubtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("ownerTournamentsPage.empty")}
              </p>
            ) : (
              rows.map(({ record, joined }) => {
                const name = getLocalizedText(record.name, language)

                const payState = bookings
                  .filter((b) => b.kind === "tournament" && b.tournament?.id === record.id)
                  .map((b) => b.status)

                const hasAwaiting = payState.some(
                  (s) => s === "awaiting_admin_approval" || s === "payment_submitted"
                )

                return (
                  <div
                    key={record.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {joined}/{record.maxTeams} {t("common.teamsJoined")} ·{" "}
                        {record.entryFeePerTeam} {t("common.egp")}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {record.status === "ended"
                            ? t("ownerTournamentsPage.ended")
                            : joined >= record.maxTeams
                              ? t("tournaments.full")
                              : t("tournaments.open")}
                        </Badge>

                        {hasAwaiting ? (
                          <Badge className="bg-amber-500/20 text-amber-100">
                            {t("ownerTournamentsPage.badgePayments")}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {record.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-foreground hover:bg-muted"
                          onClick={() => setEndingTournament(record.id)}
                        >
                          {t("ownerTournamentsPage.endTournament")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/40 text-red-600 hover:bg-red-500/10"
                        onClick={() => setDeletingTournament(record.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!endingTournament} onOpenChange={() => setEndingTournament(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("ownerTournamentsPage.confirmEndTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("ownerTournamentsPage.confirmEndDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("ownerTournamentsPage.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => endingTournament && handleEndTournament(endingTournament)}
            >
              {t("ownerTournamentsPage.confirmEnd")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingTournament} onOpenChange={() => setDeletingTournament(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tournament? This action cannot be undone and will remove all data including registrations and payments.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("ownerTournamentsPage.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTournament && handleDeleteTournament(deletingTournament)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}