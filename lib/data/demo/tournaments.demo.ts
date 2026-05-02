import type { TournamentDetail, TournamentSummary } from "@/lib/types/tournament"

export const DEMO_TOURNAMENT_SUMMARIES: TournamentSummary[] = [
  {
    id: "1",
    ownerId: "owner-1",
    name: { ar: "بطولة الربيع 2026", en: "Spring Championship 2026" },
    imageUrl: "/images/playground-1.jpg",
    venueName: { ar: "النادي الأهلي الرياضي", en: "Al Ahly Sports Club" },
    scheduleLabel: { ar: "15-20 أبريل 2026", en: "Apr 15-20, 2026" },
    entryFeePerTeam: 400,
    teamsJoined: 12,
    maxTeams: 16,
    status: "open",
    prize: { first: 5000, second: 2000, bestPlayer: 500, bestGoalkeeper: 500 },
  },
  {
    id: "2",
    ownerId: "owner-2",
    name: { ar: "كأس القاهرة", en: "Cairo Cup" },
    imageUrl: "/images/playground-2.jpg",
    venueName: { ar: "استاد القاهرة", en: "Cairo Stadium" },
    scheduleLabel: { ar: "1-5 مايو 2026", en: "May 1-5, 2026" },
    entryFeePerTeam: 500,
    teamsJoined: 8,
    maxTeams: 8,
    status: "full",
    prize: { first: 3000, second: 1500, bestPlayer: 300, bestGoalkeeper: 300 },
  },
]

const detailFrom = (
  summary: TournamentSummary,
  extra: Partial<TournamentDetail>,
): TournamentDetail => ({
  ...summary,
  address: extra.address ?? summary.venueName.en ?? summary.venueName.ar,
  formatLabel: extra.formatLabel ?? { ar: "كرة قدم", en: "Football" },
  description:
    extra.description ??
    {
      ar: "بيانات تجريبية غير مستخدمة في الإنتاج.",
      en: "Demo-only data not used in production.",
    },
  startDate: extra.startDate ?? "2026-04-15T18:00:00.000Z",
  endDate: extra.endDate ?? "2026-04-20T22:00:00.000Z",
  startDateLabel: extra.startDateLabel ?? { ar: "15 أبريل 2026", en: "April 15, 2026" },
  endDateLabel: extra.endDateLabel ?? { ar: "20 أبريل 2026", en: "April 20, 2026" },
  pointsEarned: extra.pointsEarned ?? { participation: 50, winner: 200, runnerUp: 100 },
  registeredTeams: extra.registeredTeams ?? [],
})

export const DEMO_TOURNAMENT_DETAILS: Record<string, TournamentDetail> = {
  "1": detailFrom(DEMO_TOURNAMENT_SUMMARIES[0], {
    address: "Nasr City, Cairo",
    formatLabel: { ar: "كرة قدم 5x5", en: "5v5 Football" },
    description: {
      ar: "بطولة تجريبية غير مستخدمة في الإنتاج.",
      en: "Demo-only tournament not used in production.",
    },
    registeredTeams: [
      {
        id: "team-1",
        name: { ar: "إف سي القاهرة", en: "FC Cairo" },
        players: 5,
        captain: { id: "captain-1", username: "ahmed_m", avatar: null },
      },
      {
        id: "team-2",
        name: { ar: "جيزة يونايتد", en: "Giza United" },
        players: 5,
        captain: { id: "captain-2", username: "mohamed_s", avatar: null },
      },
    ],
  }),
}

export function getDemoTournamentDetail(id: string): TournamentDetail | null {
  if (DEMO_TOURNAMENT_DETAILS[id]) {
    return DEMO_TOURNAMENT_DETAILS[id]
  }

  const summary = DEMO_TOURNAMENT_SUMMARIES.find((tournament) => tournament.id === id)
  if (!summary) return null

  return detailFrom(summary, {})
}
