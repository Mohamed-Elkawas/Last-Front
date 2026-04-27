import {
  Calendar,
  Crown,
  Flame,
  Shield,
  Target,
  Trophy,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const DEMO_PROFILE_META = {
  rating: 87,
  skillLevel: 4,
  stats: {
    pace: 85,
    shooting: 82,
    passing: 78,
    dribbling: 88,
    defense: 45,
    physical: 72,
  },
  gameStats: {
    matchesPlayed: 24,
    wins: 18,
    goals: 12,
    tournamentsJoined: 5,
    tournamentsWon: 2,
  },
} as const

export type DemoBadge = {
  id: string
  nameKey: string
  descriptionKey: string
  icon: LucideIcon
  color: string
  earned: boolean
}

export const DEMO_PROFILE_BADGES: DemoBadge[] = [
  {
    id: "beginner",
    nameKey: "profile.beginner",
    descriptionKey: "profile.beginnerDescription",
    icon: Target,
    color: "bg-slate-500",
    earned: true,
  },
  {
    id: "regular",
    nameKey: "profile.regular",
    descriptionKey: "profile.regularDescription",
    icon: Calendar,
    color: "bg-blue-500",
    earned: true,
  },
  {
    id: "pro",
    nameKey: "profile.pro",
    descriptionKey: "profile.proDescription",
    icon: Zap,
    color: "bg-amber-500",
    earned: true,
  },
  {
    id: "winner",
    nameKey: "profile.winner",
    descriptionKey: "profile.winnerDescription",
    icon: Trophy,
    color: "bg-yellow-500",
    earned: true,
  },
  {
    id: "captain",
    nameKey: "profile.captain",
    descriptionKey: "profile.captainDescription",
    icon: Shield,
    color: "bg-primary",
    earned: true,
  },
  {
    id: "streak",
    nameKey: "profile.streak",
    descriptionKey: "profile.streakDescription",
    icon: Flame,
    color: "bg-orange-500",
    earned: false,
  },
  {
    id: "legend",
    nameKey: "profile.legend",
    descriptionKey: "profile.legendDescription",
    icon: Crown,
    color: "bg-purple-500",
    earned: false,
  },
]

export const DEMO_PROFILE_ACTIVITY = [
  { type: "booking", titleKey: "profile.bookedAhly", dateKey: "profile.twoHoursAgo", points: "+10" },
  { type: "tournament", titleKey: "profile.joinedSpring", dateKey: "profile.yesterday", points: "+50" },
  { type: "match", titleKey: "profile.wonFriendly", dateKey: "profile.threeDaysAgo", points: "+25" },
] as const
