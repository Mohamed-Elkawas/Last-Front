import { http } from "@/lib/API/http-client"
import { usePointsStore } from "@/lib/points-store"
import type { PointsTransaction } from "@/lib/types/points"

export type CreatePointsTransactionPayload = Omit<
  PointsTransaction,
  "id" | "createdAt" | "balanceAfter"
>

export type PointsSummaryResponse = {
  balance: number
  transactions?: PointsTransaction[]
}

const USE_MOCK_UNCONNECTED_FEATURES =
  process.env.NEXT_PUBLIC_MOCK_UNCONNECTED_FEATURES === "true"

export async function getMyPoints(): Promise<PointsSummaryResponse> {
  if (USE_MOCK_UNCONNECTED_FEATURES) {
    const store = usePointsStore.getState()

    return {
      balance: store.balance,
      transactions: store.transactions,
    }
  }

  return http<PointsSummaryResponse>("/api/points/me")
}

export async function createPointsTransaction(
  payload: CreatePointsTransactionPayload,
): Promise<PointsSummaryResponse> {
  if (USE_MOCK_UNCONNECTED_FEATURES) {
    usePointsStore.getState().addTransaction(payload)

    const store = usePointsStore.getState()

    return {
      balance: store.balance,
      transactions: store.transactions,
    }
  }

  return http<PointsSummaryResponse>("/api/points/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

function calculateBookingReward(amountPaid: number) {
  return Math.max(Math.floor(amountPaid / 20), 0)
}

export async function grantBookingRewardPoints(
  bookingId: string,
  amountPaid: number,
) {
  const earned = calculateBookingReward(amountPaid)
  if (earned <= 0) return null

  return createPointsTransaction({
    type: "booking_reward",
    amount: earned,
    reason: `Booking reward +${earned}`,
    entityId: bookingId,
    entityType: "booking",
  })
}

export async function revokeBookingRewardPoints(
  bookingId: string,
  amountPaid: number,
) {
  const earned = calculateBookingReward(amountPaid)
  if (earned <= 0) return null

  return createPointsTransaction({
    type: "booking_reward_revoked",
    amount: -Math.abs(earned),
    reason: `Revoked booking reward (${earned})`,
    entityId: bookingId,
    entityType: "booking",
  })
}

export async function redeemPointsForBooking(
  bookingId: string,
  pointsUsed: number,
) {
  if (pointsUsed <= 0) return null

  return createPointsTransaction({
    type: "points_redeemed",
    amount: -Math.abs(pointsUsed),
    reason: `Redeemed ${pointsUsed} points`,
    entityId: bookingId,
    entityType: "booking",
  })
}

export async function refundRedeemedPoints(
  bookingId: string,
  pointsUsed: number,
) {
  if (pointsUsed <= 0) return null

  return createPointsTransaction({
    type: "points_refund",
    amount: Math.abs(pointsUsed),
    reason: "Refund for cancelled booking",
    entityId: bookingId,
    entityType: "booking",
  })
}