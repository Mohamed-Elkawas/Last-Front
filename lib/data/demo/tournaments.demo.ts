import type { TournamentDetail, TournamentSummary } from "@/lib/types/tournament"

export const DEMO_TOURNAMENT_SUMMARIES: TournamentSummary[] = [
  {
    id: "1",
    name: { ar: "بطولة الربيع 2026", en: "Spring Championship 2026" },
    imageUrl: "/images/playground-1.jpg",
    venueName: { ar: "النادي الأهلي الرياضي", en: "Al Ahly Sports Club" },
    scheduleLabel: { ar: "15–20 أبريل 2026", en: "Apr 15–20, 2026" },
    entryFeePerTeam: 400,
    teamsJoined: 12,
    maxTeams: 16,
    status: "open",
    prize: {
      first: 5000,
      second: 2000,
      bestPlayer: 500,
      bestGoalkeeper: 500,
    },
  },
  {
    id: "2",
    name: { ar: "كأس القاهرة", en: "Cairo Cup" },
    imageUrl: "/images/playground-2.jpg",
    venueName: { ar: "استاد القاهرة", en: "Cairo Stadium" },
    scheduleLabel: { ar: "1–5 مايو 2026", en: "May 1–5, 2026" },
    entryFeePerTeam: 500,
    teamsJoined: 8,
    maxTeams: 8,
    status: "full",
    prize: {
      first: 3000,
      second: 1500,
      bestPlayer: 300,
      bestGoalkeeper: 300,
    },
  },
  {
    id: "3",
    name: { ar: "دوري رمضان", en: "Ramadan League" },
    imageUrl: "/images/playground-3.jpg",
    venueName: { ar: "زمالك أرينا", en: "Zamalek Arena" },
    scheduleLabel: { ar: "15–30 مارس 2026", en: "Mar 15–30, 2026" },
    entryFeePerTeam: 350,
    teamsJoined: 12,
    maxTeams: 12,
    status: "completed",
    prize: {
      first: 4000,
      second: 2000,
      bestPlayer: 400,
      bestGoalkeeper: 400,
    },
  },
  {
    id: "4",
    name: { ar: "بطولة الصيف 5×5", en: "Summer 5v5 Tournament" },
    imageUrl: "/images/playground-1.jpg",
    venueName: { ar: "مركز معادي الرياضي", en: "Maadi Sports Center" },
    scheduleLabel: { ar: "10–15 يونيو 2026", en: "Jun 10–15, 2026" },
    entryFeePerTeam: 300,
    teamsJoined: 4,
    maxTeams: 16,
    status: "open",
    prize: {
      first: 2500,
      second: 1000,
      bestPlayer: 250,
      bestGoalkeeper: 250,
    },
  },
  {
    id: "5",
    name: { ar: "كأس محاربي الويكند", en: "Weekend Warriors Cup" },
    imageUrl: "/images/playground-2.jpg",
    venueName: { ar: "هليوبوليس هَب", en: "Heliopolis Hub" },
    scheduleLabel: { ar: "25–27 أبريل 2026", en: "Apr 25–27, 2026" },
    entryFeePerTeam: 450,
    teamsJoined: 10,
    maxTeams: 12,
    status: "open",
    prize: {
      first: 3500,
      second: 1500,
      bestPlayer: 350,
      bestGoalkeeper: 350,
    },
  },
]

const detailFrom = (summary: TournamentSummary, extra: Partial<TournamentDetail>): TournamentDetail => ({
  ...summary,
  address: extra.address ?? summary.venueName,
  formatLabel: extra.formatLabel ?? { ar: "كرة قدم", en: "Football" },
  description:
    extra.description ??
    {
      ar: "بطولة تجريبية للواجهة فقط — سيتم استبدالها ببيانات الخادم.",
      en: "Demo tournament for the UI only — will be replaced by server data.",
    },
  startDateLabel: extra.startDateLabel ?? summary.scheduleLabel,
  endDateLabel: extra.endDateLabel ?? summary.scheduleLabel,
  pointsEarned: extra.pointsEarned ?? { participation: 50, winner: 200, runnerUp: 100 },
  registeredTeams: extra.registeredTeams ?? [],
})

export const DEMO_TOURNAMENT_DETAILS: Record<string, TournamentDetail> = {
  "1": detailFrom(DEMO_TOURNAMENT_SUMMARIES[0], {
    address: { ar: "مدينة نصر، القاهرة", en: "Nasr City, Cairo" },
    formatLabel: { ar: "كرة قدم 5×5", en: "5v5 Football" },
    description: {
      ar: "انضم إلى أكبر بطولة ربيعية لكرة القدم! نافس أفضل الفرق في القاهرة واربح جوائز رائعة. جميع المستويات مرحّب بها.",
      en: "Join the biggest spring football tournament of the year! Compete against the best teams in Cairo and win amazing prizes. All skill levels welcome.",
    },
    startDateLabel: { ar: "15 أبريل 2026", en: "April 15, 2026" },
    endDateLabel: { ar: "20 أبريل 2026", en: "April 20, 2026" },
    pointsEarned: { participation: 50, winner: 200, runnerUp: 100 },
    registeredTeams: [
      { name: { ar: "إف سي القاهرة", en: "FC Cairo" }, players: 5, captain: { username: "ahmed_m", avatar: null } },
      { name: { ar: "جيزة يونايتد", en: "Giza United" }, players: 5, captain: { username: "mohamed_s", avatar: null } },
      { name: { ar: "نجوم مدينة نصر", en: "Nasr Stars" }, players: 5, captain: { username: "omar_k", avatar: null } },
      { name: { ar: "هليوبوليس إف سي", en: "Heliopolis FC" }, players: 5, captain: { username: "youssef_a", avatar: null } },
      { name: { ar: "محاربو المعادي", en: "Maadi Warriors" }, players: 5, captain: { username: "karim_h", avatar: null } },
    ],
  }),
}

export function getDemoTournamentDetail(id: string): TournamentDetail | null {
  if (DEMO_TOURNAMENT_DETAILS[id]) {
    return DEMO_TOURNAMENT_DETAILS[id]
  }
  const summary = DEMO_TOURNAMENT_SUMMARIES.find((t) => t.id === id)
  if (!summary) return null
  return detailFrom(summary, {})
}
