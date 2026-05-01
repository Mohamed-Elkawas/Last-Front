"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { useAppTranslations } from "@/hooks/use-app-translations"
import { useBookingStore } from "@/lib/booking-store"
import { useOwnerTournamentsStore } from "@/lib/owner-tournaments-store"
import { countTournamentRegistrations } from "@/lib/domain/tournament/catalog-merge"

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
  const { language, hasHydrated } = useAppTranslations()
  const isArabic = language === "ar"

  const tournaments = useOwnerTournamentsStore((state) => state.tournaments)
  const endTournament = useOwnerTournamentsStore((state) => state.endTournament)
  const bookings = useBookingStore((state) => state.bookings)

  const [endingTournament, setEndingTournament] = useState<string | null>(null)
  const [deletingTournament, setDeletingTournament] = useState<string | null>(
    null,
  )

  const labels = {
    title: isArabic ? "البطولات" : "Tournaments",
    subtitle: isArabic ? "إدارة البطولات والمسابقات" : "Manage your competitions",
    create: isArabic ? "إنشاء بطولة" : "Create Tournament",
    listTitle: isArabic ? "بطولاتك" : "Your Tournaments",
    empty: isArabic ? "لا توجد بطولات حتى الآن" : "No tournaments yet",
    manage: isArabic ? "إدارة" : "Manage",
    end: isArabic ? "إنهاء" : "End",
    teams: isArabic ? "فرق" : "teams",
    egp: isArabic ? "جنيه" : "EGP",
    deleteTitle: isArabic ? "حذف البطولة؟" : "Delete Tournament?",
    deleteDesc: isArabic
      ? "هل أنت متأكد من حذف هذه البطولة؟ سيتم حذف بياناتها من التخزين المحلي."
      : "Are you sure you want to delete this tournament? Its local data will be removed.",
    delete: isArabic ? "حذف" : "Delete",
    cancel: isArabic ? "إلغاء" : "Cancel",
    endTitle: isArabic ? "إنهاء البطولة؟" : "End Tournament?",
    endDesc: isArabic
      ? "هل أنت متأكد من إنهاء هذه البطولة؟"
      : "Are you sure you want to end this tournament?",
    confirm: isArabic ? "تأكيد" : "Confirm",
  }

  const rows = useMemo(() => {
    return tournaments.map((tournament) => ({
      record: tournament,
      joined: countTournamentRegistrations(bookings, tournament.id),
    }))
  }, [tournaments, bookings])

  const handleDeleteTournament = (tournamentId: string) => {
    const currentTournaments = useOwnerTournamentsStore.getState().tournaments

    useOwnerTournamentsStore.setState({
      tournaments: currentTournaments.filter((item) => item.id !== tournamentId),
    })

    const currentBookings = useBookingStore.getState().bookings

    useBookingStore.setState({
      bookings: currentBookings.filter(
        (booking) =>
          booking.kind !== "tournament" ||
          booking.tournament?.id !== tournamentId,
      ),
    })

    setDeletingTournament(null)
  }

  const handleEndTournament = (tournamentId: string) => {
    endTournament(tournamentId)
    setEndingTournament(null)
  }

  if (!hasHydrated) return null

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{labels.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>

        <Button asChild className="w-fit bg-emerald-600 hover:bg-emerald-700">
          <Link href="/owner/tournaments/create">
            <PlusCircle className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            {labels.create}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{labels.listTitle}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              {labels.empty}
            </p>
          ) : (
            rows.map(({ record, joined }) => {
              const name =
                getLocalizedText(record.name, language) ||
                (isArabic ? "بطولة بدون اسم" : "Unnamed Tournament")

              return (
                <div
                  key={record.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className={isArabic ? "text-right" : "text-left"}>
                    <p className="text-lg font-semibold">{name}</p>

                    <p className="text-sm text-muted-foreground">
                      {joined}/{record.maxTeams} {labels.teams} ·{" "}
                      {record.entryFeePerTeam} {labels.egp}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Link href={`/owner/tournaments/${record.id}`}>
                        {labels.manage}
                      </Link>
                    </Button>

                    {record.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEndingTournament(record.id)}
                      >
                        {labels.end}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/40 text-red-600 hover:bg-red-50"
                      onClick={() => setDeletingTournament(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!endingTournament}
        onOpenChange={(open) => {
          if (!open) setEndingTournament(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.endTitle}</AlertDialogTitle>
            <AlertDialogDescription>{labels.endDesc}</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                endingTournament && handleEndTournament(endingTournament)
              }
            >
              {labels.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingTournament}
        onOpenChange={(open) => {
          if (!open) setDeletingTournament(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{labels.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                deletingTournament &&
                handleDeleteTournament(deletingTournament)
              }
            >
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}