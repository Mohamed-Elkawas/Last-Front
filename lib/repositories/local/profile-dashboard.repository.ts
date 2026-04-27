import {
  DEMO_PROFILE_ACTIVITY,
  DEMO_PROFILE_BADGES,
  DEMO_PROFILE_META,
} from "@/lib/data/demo/profile.demo"

export function repositoryGetProfileDashboardSnapshot() {
  return {
    meta: DEMO_PROFILE_META,
    badges: DEMO_PROFILE_BADGES,
    activity: DEMO_PROFILE_ACTIVITY,
  }
}

export type ProfileDashboardRepositorySnapshot = ReturnType<typeof repositoryGetProfileDashboardSnapshot>
