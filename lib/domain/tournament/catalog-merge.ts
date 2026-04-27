import type { PersistedBooking } from "@/lib/types/booking"
import type { OwnerTournamentRecord } from "@/lib/types/owner-tournament"
import type { TournamentDetail, TournamentSummary, TournamentTeamPreview } from "@/lib/types/tournament"

export function countTournamentRegistrations(bookings: PersistedBooking[], tournamentId: string): number {
  return bookings.filter(
    (b) =>
      b.kind === "tournament" &&
      b.tournament?.id === tournamentId &&
      !["cancelled", "expired", "rejected"].includes(b.status),
  ).length
}

export function ownerRecordToSummary(
  record: OwnerTournamentRecord,
  bookings: PersistedBooking[],
): TournamentSummary {
  const teamsJoined = countTournamentRegistrations(bookings, record.id)
  const status = teamsJoined >= record.maxTeams ? "full" : "open"
  return {
    id: record.id,
    name: record.name,
    imageUrl: record.imageUrl,
    venueName: record.venueName,
    scheduleLabel: record.scheduleLabel,
    entryFeePerTeam: record.entryFeePerTeam,
    teamsJoined,
    maxTeams: record.maxTeams,
    status,
    prize: record.prize,
  }
}

export function ownerRecordToDetail(
  record: OwnerTournamentRecord,
  bookings: PersistedBooking[],
): TournamentDetail {
  const summary = ownerRecordToSummary(record, bookings)
  const registeredTeams: TournamentTeamPreview[] = bookings
    .filter(
      (b) =>
        b.kind === "tournament" &&
        b.tournament?.id === record.id &&
        !["cancelled", "expired", "rejected"].includes(b.status),
    )
    .map((b) => ({
      name: { en: b.tournament?.teamName ?? "Team", ar: b.tournament?.teamName ?? "فريق" },
      players: b.tournament?.players ?? 0,
      captain: { username: b.playerDisplayName ?? b.payment?.payerName ?? "captain", avatar: null },
    }))

  return {
    ...summary,
    address: record.venueName,
    formatLabel: { en: "Organizer tournament", ar: "بطولة منظم" },
    description: record.description,
    startDateLabel: record.startDateLabel,
    endDateLabel: record.endDateLabel,
    pointsEarned: { participation: 40, winner: 180, runnerUp: 90 },
    registeredTeams,
  }
}
