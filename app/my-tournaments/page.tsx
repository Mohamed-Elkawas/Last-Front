"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle, Clock, Trophy, XCircle } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslate } from "@/hooks/use-translate"
import {
  cleanupRegistrations,
  listMyTournamentRegistrations,
} from "@/lib/services/tournaments.service"
import type { TournamentDetail, TournamentRegistration } from "@/lib/types/tournament"

type RegistrationWithTournament = TournamentRegistration & {
  tournament?: TournamentDetail | null
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending_payment":
      return "bg-amber-100 text-amber-800"
    case "payment_submitted":
      return "bg-blue-100 text-blue-800"
    case "awaiting_owner_approval":
      return "bg-indigo-100 text-indigo-800"
    case "confirmed":
      return "bg-emerald-100 text-emerald-800"
    case "rejected":
      return "bg-rose-100 text-rose-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending_payment":
      return Clock
    case "awaiting_owner_approval":
    case "payment_submitted":
      return AlertCircle
    case "confirmed":
      return CheckCircle
    case "rejected":
      return XCircle
    default:
      return Trophy
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending_payment":
      return "Pending payment"
    case "payment_submitted":
      return "Payment submitted"
    case "awaiting_owner_approval":
      return "Awaiting owner approval"
    case "confirmed":
      return "Confirmed"
    case "rejected":
      return "Rejected"
    default:
      return status
  }
}

export default function MyTournamentsPage() {
  const { language } = useTranslate()
  const [data, setData] = useState<RegistrationWithTournament[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)

    try {
      cleanupRegistrations()

      const registrations = await listMyTournamentRegistrations()

      const visibleRegistrations = registrations.filter((reg) => {
        if (reg.status === "cancelled") return false
        if (reg.status === "expired") return false

        const expiresAt = reg.expiresAt ? new Date(reg.expiresAt).getTime() : 0

        if (
          reg.status === "pending_payment" &&
          expiresAt &&
          Date.now() >= expiresAt
        ) {
          return false
        }

        return true
      })

      setData(visibleRegistrations)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground">
          Loading...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Tournaments</h1>
            <p className="mt-2 text-muted-foreground">
              Track your tournament registrations and payment status.
            </p>
          </div>

          <Button asChild>
            <Link href="/tournaments">Browse tournaments</Link>
          </Button>
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>

            <h3 className="mt-4 text-lg font-semibold">
              No tournament registrations yet
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Join a tournament and it will appear here.
            </p>

            <Button className="mt-4" asChild>
              <Link href="/tournaments">Find tournaments</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((reg) => {
              const tournamentName =
                reg.tournament?.name?.[language] ||
                reg.tournament?.name?.en ||
                reg.tournament?.name?.ar ||
                "Tournament"

              const amount = reg.tournament?.entryFeePerTeam ?? 0
              const StatusIcon = getStatusIcon(reg.status)

              return (
                <Card key={reg.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 shrink-0 text-primary" />
                        <h3 className="truncate font-semibold">
                          {tournamentName}
                        </h3>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {reg.teamName} • {reg.playersCount} players
                      </p>

                      <p className="mt-1 text-sm font-medium text-primary">
                        {amount.toLocaleString()} EGP
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={getStatusColor(reg.status)}>
                        <StatusIcon className="me-1 h-3.5 w-3.5" />
                        {getStatusLabel(reg.status)}
                      </Badge>

                      {reg.status === "pending_payment" && (
                        <Button asChild size="sm">
                          <Link
                            href={`/tournaments/${reg.tournamentId}/join/payment?registrationId=${reg.id}&method=${reg.paymentMethod ?? "vodafone_cash"}`}
                          >
                            Complete Payment
                          </Link>
                        </Button>
                      )}

                      {(reg.status === "awaiting_owner_approval" ||
                        reg.status === "payment_submitted") && (
                        <span className="text-sm text-muted-foreground">
                          Waiting for owner review
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}