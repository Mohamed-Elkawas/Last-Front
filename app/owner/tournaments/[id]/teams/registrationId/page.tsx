"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAppTranslations } from "@/hooks/use-app-translations"
import {
  approveTournamentRegistration,
  getTournamentRegistrationById,
  rejectTournamentRegistration,
} from "@/lib/services/tournaments.service"

type Player = {
  id?: string
  username?: string
  avatar?: string | null
  isCaptain?: boolean
  phone?: string
  position?: string
}

type RegistrationView = {
  id: string
  teamName?: string
  players?: Player[]
  playersCount?: number
  status: string
  createdAt?: string
  tournament?: {
    name?: {
      en?: string
      ar?: string
    }
  } | null
}

function getStatusClass(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-700"
    case "awaiting_owner_approval":
    case "payment_submitted":
      return "bg-amber-100 text-amber-700"
    case "rejected":
      return "bg-red-100 text-red-700"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function canReview(status: string) {
  return status === "awaiting_owner_approval" || status === "payment_submitted"
}

export default function TeamRosterPage() {
  const params = useParams()
  const tournamentId = String(params.id)
  const registrationId = String(params.registrationId)

  const { language, hasHydrated } = useAppTranslations()
  const isArabic = language === "ar"

  const [registration, setRegistration] = useState<RegistrationView | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  const labels = {
    back: isArabic ? "العودة لطلبات الفرق" : "Back to team requests",
    title: isArabic ? "قائمة الفريق" : "Team Roster",
    subtitle: isArabic
      ? "راجع بيانات الفريق واللاعبين قبل القبول أو الرفض."
      : "Review team and player details before approval or rejection.",
    team: isArabic ? "الفريق" : "Team",
    status: isArabic ? "الحالة" : "Status",
    players: isArabic ? "اللاعبين" : "Players",
    captain: isArabic ? "كابتن الفريق" : "Team Captain",
    player: isArabic ? "لاعب" : "Player",
    phone: isArabic ? "الهاتف" : "Phone",
    position: isArabic ? "المركز" : "Position",
    noPlayers: isArabic ? "لا توجد بيانات لاعبين" : "No player data available",
    adminNotes: isArabic ? "ملاحظات الإدارة" : "Admin Notes",
    notesPlaceholder: isArabic
      ? "اكتب ملاحظة داخلية عن الفريق..."
      : "Write an internal note about this team...",
    approve: isArabic ? "قبول الفريق" : "Approve Team",
    reject: isArabic ? "رفض الفريق" : "Reject Team",
    loading: isArabic ? "جاري التحميل..." : "Loading...",
    notFound: isArabic ? "طلب الفريق غير موجود" : "Team request not found",
  }

  const load = async () => {
    setLoading(true)

    try {
      const result = await getTournamentRegistrationById(registrationId)
      setRegistration(result as RegistrationView | null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId])

  const handleApprove = async () => {
    if (!registration) return

    setBusy(true)

    try {
      await approveTournamentRegistration(registration.id)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const handleReject = async () => {
    if (!registration) return

    setBusy(true)

    try {
      await rejectTournamentRegistration(registration.id)
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!hasHydrated) return null

  return (
    <AppShell showNavbar={false}>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Button asChild variant="ghost" className="mb-4 px-0">
          <Link href={`/owner/tournaments/${tournamentId}/teams`}>
            {isArabic ? (
              <ArrowRight className="ml-2 h-4 w-4" />
            ) : (
              <ArrowLeft className="mr-2 h-4 w-4" />
            )}
            {labels.back}
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{labels.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {labels.loading}
            </CardContent>
          </Card>
        ) : !registration ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {labels.notFound}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    {registration.teamName || labels.team}
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">
                      {labels.team}
                    </p>
                    <p className="mt-1 font-semibold">
                      {registration.teamName || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">
                      {labels.players}
                    </p>
                    <p className="mt-1 font-semibold">
                      {registration.playersCount ?? registration.players?.length ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">
                      {labels.status}
                    </p>
                    <Badge className={`mt-2 ${getStatusClass(registration.status)}`}>
                      {registration.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    {labels.players}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {!registration.players || registration.players.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                      {labels.noPlayers}
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {registration.players.map((player, index) => (
                        <div
                          key={player.id || index}
                          className="flex items-center justify-between rounded-xl border p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <User className="h-5 w-5" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  {player.username || `${labels.player} ${index + 1}`}
                                </p>

                                {player.isCaptain ? (
                                  <Badge className="bg-amber-100 text-amber-700">
                                    {labels.captain}
                                  </Badge>
                                ) : null}
                              </div>

                              <p className="text-xs text-muted-foreground">
                                {labels.position}: {player.position || "—"}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {labels.phone}: {player.phone || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{labels.adminNotes}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Textarea
                    rows={7}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={labels.notesPlaceholder}
                  />

                  {canReview(registration.status) ? (
                    <div className="flex flex-col gap-3">
                      <Button
                        disabled={busy}
                        onClick={handleApprove}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2
                          className={
                            isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"
                          }
                        />
                        {labels.approve}
                      </Button>

                      <Button
                        disabled={busy}
                        variant="destructive"
                        onClick={handleReject}
                      >
                        <XCircle
                          className={
                            isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"
                          }
                        />
                        {labels.reject}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                      {labels.status}: {registration.status}
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </AppShell>
  )
}