import type { EntityId } from "@/lib/types/common"

export type PointsTransactionType =
  | "booking_reward"
  | "booking_reward_revoked"
  | "points_redeemed"
  | "points_refund"
  | "adjustment"

export type PointsTransaction = {
  id: EntityId
  type: PointsTransactionType
  amount: number
  balanceAfter: number
  createdAt: number
  reason: string
  entityId?: EntityId
  entityType?: "booking" | "tournament" | "system"
}

