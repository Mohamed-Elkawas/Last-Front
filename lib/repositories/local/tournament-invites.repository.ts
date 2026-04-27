import { DEMO_INVITABLE_USERS } from "@/lib/data/demo/tournament-join.demo"
import type { InvitableUser } from "@/lib/types/tournament-invite"

export function repositoryListTournamentInvitableUsers(): InvitableUser[] {
  return DEMO_INVITABLE_USERS.map((u) => ({ ...u }))
}
