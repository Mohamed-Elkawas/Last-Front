"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock3,
    Eye,
    ShieldCheck,
    Users,
    XCircle,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppTranslations } from "@/hooks/use-app-translations"

import {
    approveTournamentRegistration,
    listOwnerTournamentRegistrations,
    rejectTournamentRegistration,
} from "@/lib/services/tournaments.service"

type RegistrationStatus =
    | "pending_payment"
    | "payment_submitted"
    | "awaiting_owner_approval"
    | "confirmed"
    | "rejected"
    | "cancelled"
    | "expired"

type TournamentPlayer = {
    id?: string
    username?: string
    avatar?: string | null
    isCaptain?: boolean
}

type Registration = {
    id: string
    tournamentId?: string
    ownerId?: string
    playerId?: string
    teamName?: string
    players?: TournamentPlayer[]
    playersCount?: number
    status: RegistrationStatus | string
    captainName?: string
    createdAt?: string
    updatedAt?: string
    tournament?: {
        id?: string
        name?: {
            en?: string
            ar?: string
        }
    } | null
}

type FilterKey = "all" | "pending" | "approved" | "rejected"

function getStatusClasses(status: string) {
    switch (status) {
        case "confirmed":
            return "border-emerald-200 bg-emerald-100 text-emerald-700"
        case "payment_submitted":
        case "awaiting_owner_approval":
            return "border-amber-200 bg-amber-100 text-amber-700"
        case "rejected":
            return "border-red-200 bg-red-100 text-red-700"
        case "pending_payment":
            return "border-blue-200 bg-blue-100 text-blue-700"
        default:
            return "border-border bg-muted text-muted-foreground"
    }
}

function isActionable(status: string) {
    return status === "payment_submitted" || status === "awaiting_owner_approval"
}

export default function OwnerTournamentTeamsPage() {
    const params = useParams()
    const tournamentId = String(params.id)

    const { language, hasHydrated } = useAppTranslations()
    const isArabic = language === "ar"

    const [data, setData] = useState<Registration[]>([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
    const [busyId, setBusyId] = useState<string | null>(null)

    const labels = {
        back: isArabic ? "العودة لإدارة البطولة" : "Back to workspace",
        title: isArabic ? "طلبات الفرق" : "Team Requests",
        subtitle: isArabic
            ? "راجع طلبات انضمام الفرق لهذه البطولة فقط."
            : "Review team registration requests for this tournament only.",
        all: isArabic ? "الكل" : "All",
        pending: isArabic ? "قيد المراجعة" : "Pending",
        approved: isArabic ? "مقبول" : "Approved",
        rejected: isArabic ? "مرفوض" : "Rejected",
        noRequests: isArabic ? "لا توجد طلبات حتى الآن" : "No team requests yet",
        captain: isArabic ? "الكابتن" : "Captain",
        players: isArabic ? "لاعبين" : "players",
        status: isArabic ? "الحالة" : "Status",
        approve: isArabic ? "قبول" : "Approve",
        reject: isArabic ? "رفض" : "Reject",
        view: isArabic ? "عرض الفريق" : "View Team",
        loading: isArabic ? "جاري التحميل..." : "Loading...",
        tournamentId: isArabic ? "معرّف البطولة" : "Tournament ID",
        teamFallback: isArabic ? "فريق بدون اسم" : "Unnamed Team",
        captainFallback: isArabic ? "غير محدد" : "Not specified",
    }

    const load = async () => {
        setLoading(true)

        try {
            const registrations = await listOwnerTournamentRegistrations({
                tournamentId,
            })

            setData(registrations as Registration[])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournamentId])

    const filteredData = useMemo(() => {
        if (activeFilter === "all") return data

        if (activeFilter === "pending") {
            return data.filter((reg) =>
                ["pending_payment", "payment_submitted", "awaiting_owner_approval"].includes(
                    reg.status,
                ),
            )
        }

        if (activeFilter === "approved") {
            return data.filter((reg) => reg.status === "confirmed")
        }

        return data.filter((reg) => reg.status === "rejected")
    }, [activeFilter, data])

    const counts = useMemo(() => {
        return {
            all: data.length,
            pending: data.filter((reg) =>
                ["pending_payment", "payment_submitted", "awaiting_owner_approval"].includes(
                    reg.status,
                ),
            ).length,
            approved: data.filter((reg) => reg.status === "confirmed").length,
            rejected: data.filter((reg) => reg.status === "rejected").length,
        }
    }, [data])

    const handleApprove = async (registrationId: string) => {
        setBusyId(registrationId)

        try {
            await approveTournamentRegistration(registrationId)
            await load()
        } finally {
            setBusyId(null)
        }
    }

    const handleReject = async (registrationId: string) => {
        setBusyId(registrationId)

        try {
            await rejectTournamentRegistration(registrationId)
            await load()
        } finally {
            setBusyId(null)
        }
    }

    if (!hasHydrated) return null

    return (
        <AppShell showNavbar={false}>
            <main className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Button asChild variant="ghost" className="mb-3 px-0">
                            <Link href={`/owner/tournaments/${tournamentId}`}>
                                {isArabic ? (
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                ) : (
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                )}
                                {labels.back}
                            </Link>
                        </Button>

                        <h1 className="text-3xl font-bold tracking-tight">
                            {labels.title}
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            {labels.subtitle}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            {labels.tournamentId}: {tournamentId}
                        </p>
                    </div>
                </div>

                <section className="mb-6 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">{labels.all}</p>
                                <p className="text-2xl font-bold">{counts.all}</p>
                            </div>
                            <Users className="h-5 w-5 text-emerald-600" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {labels.pending}
                                </p>
                                <p className="text-2xl font-bold">{counts.pending}</p>
                            </div>
                            <Clock3 className="h-5 w-5 text-amber-600" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {labels.approved}
                                </p>
                                <p className="text-2xl font-bold">{counts.approved}</p>
                            </div>
                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {labels.rejected}
                                </p>
                                <p className="text-2xl font-bold">{counts.rejected}</p>
                            </div>
                            <XCircle className="h-5 w-5 text-red-600" />
                        </CardContent>
                    </Card>
                </section>

                <div className="mb-5 flex flex-wrap gap-2">
                    {[
                        ["all", labels.all, counts.all],
                        ["pending", labels.pending, counts.pending],
                        ["approved", labels.approved, counts.approved],
                        ["rejected", labels.rejected, counts.rejected],
                    ].map(([key, label, count]) => (
                        <Button
                            key={String(key)}
                            type="button"
                            variant={activeFilter === key ? "default" : "outline"}
                            onClick={() => setActiveFilter(key as FilterKey)}
                        >
                            {label}
                            <span className="mx-2 rounded-full bg-background/20 px-2 text-xs">
                                {count}
                            </span>
                        </Button>
                    ))}
                </div>

                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                {labels.loading}
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                {labels.noRequests}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredData.map((reg) => {
                                    const captain =
                                        reg.captainName ||
                                        reg.players?.find((player) => player.isCaptain)
                                            ?.username ||
                                        reg.players?.[0]?.username ||
                                        labels.captainFallback

                                    return (
                                        <div
                                            key={reg.id}
                                            className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-semibold">
                                                        {reg.teamName || labels.teamFallback}
                                                    </h3>

                                                    <Badge
                                                        variant="outline"
                                                        className={getStatusClasses(reg.status)}
                                                    >
                                                        {reg.status}
                                                    </Badge>
                                                </div>

                                                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                                                    <p>
                                                        {labels.captain}: {captain}
                                                    </p>
                                                    <p>
                                                        {reg.playersCount ?? 0} {labels.players}
                                                    </p>
                                                    <p>
                                                        {labels.status}: {reg.status}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/owner/tournaments/${tournamentId}/teams/${reg.id}`}>
                                                        <Eye className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                                                        {labels.view}
                                                    </Link>
                                                </Button>

                                                {isActionable(reg.status) && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            disabled={busyId === reg.id}
                                                            onClick={() => handleApprove(reg.id)}
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
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={busyId === reg.id}
                                                            onClick={() => handleReject(reg.id)}
                                                        >
                                                            <XCircle
                                                                className={
                                                                    isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"
                                                                }
                                                            />
                                                            {labels.reject}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </AppShell>
    )
}