import type { PersistedBooking } from "@/lib/types/booking"
import type { OwnerTournamentRecord } from "@/lib/types/owner-tournament"
import type {
  TournamentDetail,
  TournamentSummary,
  TournamentTeamPreview,
} from "@/lib/types/tournament"

export function countTournamentRegistrations(
  bookings: PersistedBooking[],
  tournamentId: string,
): number {
  return bookings.filter(
    (booking) =>
      booking.kind === "tournament" &&
      booking.tournament?.id === tournamentId &&
      !["cancelled", "expired", "rejected"].includes(booking.status),
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
    ownerId: record.ownerId ?? "",
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
      (booking) =>
        booking.kind === "tournament" &&
        booking.tournament?.id === record.id &&
        !["cancelled", "expired", "rejected"].includes(booking.status),
    )
    .map((booking) => ({
      id: booking.id,
      name: {
        en: booking.tournament?.teamName ?? "Team",
        ar: booking.tournament?.teamName ?? "Team",
      },
      players: booking.tournament?.players ?? 0,
      captain: {
        id: booking.id,
        username: booking.playerDisplayName ?? booking.payment?.payerName ?? "captain",
        avatar: null,
      },
    }))

  return {
    ...summary,
    address: record.venueName.en || record.venueName.ar,
    formatLabel: { en: "Organizer tournament", ar: "Organizer tournament" },
    description: record.description,
    startDate: record.startDateLabel.en || record.startDateLabel.ar,
    endDate: record.endDateLabel.en || record.endDateLabel.ar,
    startDateLabel: record.startDateLabel,
    endDateLabel: record.endDateLabel,
    pointsEarned: { participation: 40, winner: 180, runnerUp: 90 },
    registeredTeams,
  }
}
