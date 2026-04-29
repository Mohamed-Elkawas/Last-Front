"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle,
  XCircle,
  Trophy,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  listOwnerTournamentRegistrations,
  approveTournamentRegistration,
  rejectTournamentRegistration,
} from "@/lib/services/tournaments.service"

function getStatusColor(status: string) {
  switch (status) {
    case "pending_payment":
      return "bg-amber-100 text-amber-800"
    case "payment_submitted":
    case "awaiting_owner_approval":
      return "bg-blue-100 text-blue-800"
    case "confirmed":
      return "bg-emerald-100 text-emerald-800"
    case "rejected":
      return "bg-rose-100 text-rose-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function OwnerTournamentRegistrationsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listOwnerTournamentRegistrations()
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id: string) => {
    await approveTournamentRegistration(id)
    await load()
  }

  const handleReject = async (id: string) => {
    await rejectTournamentRegistration(id)
    await load()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="p-6">Loading...</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Tournament Registrations
        </h1>

        {data.length === 0 ? (
          <div className="text-muted-foreground text-center mt-10">
            No registration requests yet
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((reg) => {
              const tournamentName =
                reg.tournament?.name?.en ||
                reg.tournament?.name?.ar ||
                "Tournament"

              return (
                <Card key={reg.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        {tournamentName}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {reg.teamName} • {reg.playersCount} players
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {reg.tournament?.entryFeePerTeam ?? 0} EGP
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(reg.status)}>
                        {reg.status}
                      </Badge>

                      {(reg.status === "payment_submitted" ||
                        reg.status === "awaiting_owner_approval") && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(reg.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(reg.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
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