import { repositoryGetProfileDashboardSnapshot } from "@/lib/repositories/local/profile-dashboard.repository"
import type { ProfileDashboardRepositorySnapshot } from "@/lib/repositories/local/profile-dashboard.repository"
import { mockDelay } from "@/lib/services/mock-delay"

export type ProfileDashboardSnapshot = ProfileDashboardRepositorySnapshot

/** Stats / badges / activity feed for profile until player stats API exists. */
export async function getProfileDashboardSnapshot(): Promise<ProfileDashboardSnapshot> {
  await mockDelay(50)
  return repositoryGetProfileDashboardSnapshot()
}
