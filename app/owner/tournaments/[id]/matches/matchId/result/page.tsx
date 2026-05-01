"use client"

import { useOwnerTournamentsStore } from "@/lib/owner-tournaments-store"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    ArrowRight,
    CircleDot,
    Lock,
    Save,
    ShieldAlert,
    Trophy,
    User,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAppTranslations } from "@/hooks/use-app-translations"
import {
    type TournamentDrawMatch,
    useTournamentDrawStore,
} from "@/lib/tournament-draw-store"

type MatchEventType = "goal" | "assist" | "yellow_card" | "red_card"

type MatchEvent = {
    id: string
    type: MatchEventType
    teamId: string
    teamName: string
    playerName: string
    minute: number
}

type MatchWithEvents = TournamentDrawMatch & {
    events?: MatchEvent[]
}

function createId(prefix: string) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `${prefix}-${crypto.randomUUID()}`
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function EnterMatchResultPage() {
    const router = useRouter()
    const params = useParams()

    const tournamentId = String(params.id)
    const matchId = String(params.matchId)

    const { language, hasHydrated } = useAppTranslations()
    const isArabic = language === "ar"

    const draw = useTournamentDrawStore((state) =>
        state.getDrawByTournamentId(tournamentId),
    )
    const saveDraw = useTournamentDrawStore((state) => state.saveDraw)

const tournament = useOwnerTournamentsStore((state) =>
  state.tournaments.find((item) => item.id === tournamentId),
)

const match = draw?.matches.find((item) => item.id === matchId) as
  | MatchWithEvents
  | undefined

const isTournamentCompleted = tournament?.status === "completed"

    const isLocked =
        match?.status === "locked" || isTournamentCompleted

    const [homeScore, setHomeScore] = useState(
        match?.homeScore !== null && match?.homeScore !== undefined
            ? String(match.homeScore)
            : "",
    )
    const [awayScore, setAwayScore] = useState(
        match?.awayScore !== null && match?.awayScore !== undefined
            ? String(match.awayScore)
            : "",
    )

    const [selectedTeamId, setSelectedTeamId] = useState(
        match?.homeTeam?.id || match?.awayTeam?.id || "",
    )
    const [playerName, setPlayerName] = useState("")
    const [minute, setMinute] = useState("1")
    const [eventType, setEventType] = useState<MatchEventType>("goal")
    const [events, setEvents] = useState<MatchEvent[]>(match?.events ?? [])

    const labels = {
        back: isArabic ? "العودة للمباريات" : "Back to matches",
        title: isArabic ? "إدخال نتيجة المباراة" : "Enter Match Result",
        subtitle: isArabic
            ? "سجّل النتيجة وأحداث اللاعبين لهذه المباراة."
            : "Submit the match score and player events.",
        noMatch: isArabic ? "المباراة غير موجودة" : "Match not found",
        noDraw: isArabic ? "لم يتم إنشاء القرعة بعد" : "No draw generated yet",
        homeScore: isArabic ? "نتيجة الفريق الأول" : "Home Score",
        awayScore: isArabic ? "نتيجة الفريق الثاني" : "Away Score",
        events: isArabic ? "أحداث المباراة" : "Match Events",
        team: isArabic ? "الفريق" : "Team",
        player: isArabic ? "اسم اللاعب" : "Player Name",
        minute: isArabic ? "الدقيقة" : "Minute",
        addEvent: isArabic ? "إضافة حدث" : "Add Event",
        save: isArabic ? "حفظ النتيجة" : "Save Result",
        finalize: isArabic ? "اعتماد المباراة" : "Finalize Match",
        locked: isArabic ? "المباراة معتمدة ومغلقة" : "Match is finalized and locked",
        goal: isArabic ? "هدف" : "Goal",
        assist: isArabic ? "أسيست" : "Assist",
        yellowCard: isArabic ? "كارت أصفر" : "Yellow Card",
        redCard: isArabic ? "كارت أحمر" : "Red Card",
        noEvents: isArabic ? "لا توجد أحداث بعد" : "No events yet",
        vs: isArabic ? "ضد" : "VS",
        bye: isArabic ? "انتظار" : "Bye",
    }

    const teams = useMemo(() => {
        if (!match) return []

        return [match.homeTeam, match.awayTeam].filter(Boolean) as NonNullable<
            TournamentDrawMatch["homeTeam"]
        >[]
    }, [match])

    const eventLabels: Record<MatchEventType, string> = {
        goal: labels.goal,
        assist: labels.assist,
        yellow_card: labels.yellowCard,
        red_card: labels.redCard,
    }

    const selectedTeam = teams.find((team) => team.id === selectedTeamId)

    const handleAddEvent = () => {
        if (isLocked) return
        if (!selectedTeam) return
        if (!playerName.trim()) return

        const newEvent: MatchEvent = {
            id: createId("event"),
            type: eventType,
            teamId: selectedTeam.id,
            teamName: selectedTeam.name,
            playerName: playerName.trim(),
            minute: Math.max(1, Number(minute) || 1),
        }

        setEvents((prev) => [...prev, newEvent])
        setPlayerName("")
        setMinute("1")
    }

    const saveMatch = (nextStatus: "completed" | "locked") => {
        if (!draw || !match) return

        const home = Number(homeScore)
        const away = Number(awayScore)

        if (Number.isNaN(home) || Number.isNaN(away)) return
        if (home < 0 || away < 0) return

        const updatedMatches = draw.matches.map((item) => {
            if (item.id !== matchId) return item

            return {
                ...item,
                homeScore: home,
                awayScore: away,
                status: nextStatus,
                events,
            }
        })

        saveDraw({
            ...draw,
            matches: updatedMatches,
        })

        router.push(`/owner/tournaments/${tournamentId}/matches`)
    }

    if (!hasHydrated) return null

    return (
        <AppShell showNavbar={false}>
            <main className="mx-auto max-w-6xl px-6 py-8">
                <Button asChild variant="ghost" className="mb-4 px-0">
                    <Link href={`/owner/tournaments/${tournamentId}/matches`}>
                        {isArabic ? (
                            <ArrowRight className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowLeft className="mr-2 h-4 w-4" />
                        )}
                        {labels.back}
                    </Link>
                </Button>

                {!draw || !match ? (
                    <Card>
                        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                            <ShieldAlert className="h-10 w-10" />
                            <p>{!draw ? labels.noDraw : labels.noMatch}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold">{labels.title}</h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {labels.subtitle}
                                </p>
                            </div>

                            {isLocked ? (
                                <Badge className="w-fit bg-emerald-100 text-emerald-700">
                                    <Lock className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                                    {labels.locked}
                                </Badge>
                            ) : null}
                        </div>

                        <Card>
                            <CardContent className="p-6">
                                <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
                                    <div className="rounded-2xl border p-5 text-center">
                                        <Trophy className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
                                        <h2 className="text-xl font-bold">
                                            {match.homeTeam?.name || labels.bye}
                                        </h2>
                                        <Input
                                            type="number"
                                            min={0}
                                            disabled={isLocked}
                                            value={homeScore}
                                            onChange={(event) => setHomeScore(event.target.value)}
                                            className="mx-auto mt-4 max-w-[160px] text-center text-2xl font-bold"
                                            placeholder="0"
                                        />
                                    </div>

                                    <Badge className="mx-auto w-fit px-4 py-2">{labels.vs}</Badge>

                                    <div className="rounded-2xl border p-5 text-center">
                                        <Trophy className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
                                        <h2 className="text-xl font-bold">
                                            {match.awayTeam?.name || labels.bye}
                                        </h2>
                                        <Input
                                            type="number"
                                            min={0}
                                            disabled={isLocked}
                                            value={awayScore}
                                            onChange={(event) => setAwayScore(event.target.value)}
                                            className="mx-auto mt-4 max-w-[160px] text-center text-2xl font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{labels.events}</CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{labels.team}</p>
                                        <select
                                            disabled={isLocked}
                                            value={selectedTeamId}
                                            onChange={(event) => setSelectedTeamId(event.target.value)}
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                                        >
                                            {teams.map((team) => (
                                                <option key={team.id} value={team.id}>
                                                    {team.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">{labels.player}</p>
                                            <Input
                                                disabled={isLocked}
                                                value={playerName}
                                                onChange={(event) => setPlayerName(event.target.value)}
                                                placeholder={labels.player}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">{labels.minute}</p>
                                            <Input
                                                disabled={isLocked}
                                                type="number"
                                                min={1}
                                                value={minute}
                                                onChange={(event) => setMinute(event.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {(
                                            [
                                                ["goal", labels.goal],
                                                ["assist", labels.assist],
                                                ["yellow_card", labels.yellowCard],
                                                ["red_card", labels.redCard],
                                            ] as Array<[MatchEventType, string]>
                                        ).map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                disabled={isLocked}
                                                onClick={() => setEventType(value)}
                                                className={`rounded-xl border p-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${eventType === value
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                        : "border-border hover:bg-muted"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <Button
                                        type="button"
                                        disabled={isLocked}
                                        onClick={handleAddEvent}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <CircleDot
                                            className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                                        />
                                        {labels.addEvent}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{labels.events}</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    {events.length === 0 ? (
                                        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                                            {labels.noEvents}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {events.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="flex items-center justify-between rounded-xl border p-4"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                            <User className="h-5 w-5" />
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold">{event.playerName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {event.teamName} · {event.minute}'
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Badge variant="outline">
                                                        {eventLabels[event.type]}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {!isLocked ? (
                            <div className="flex flex-col justify-end gap-3 sm:flex-row">
                                <Button
                                    variant="outline"
                                    onClick={() => saveMatch("completed")}
                                >
                                    <Save
                                        className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                                    />
                                    {labels.save}
                                </Button>

                                <Button
                                    onClick={() => saveMatch("locked")}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Lock
                                        className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                                    />
                                    {labels.finalize}
                                </Button>
                            </div>
                        ) : null}
                    </div>
                )}
            </main>
        </AppShell>
    )
}