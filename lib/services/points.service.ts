import { usePointsStore } from "@/lib/points-store"

export function grantBookingRewardPoints(bookingId: string, amountPaid: number) {
  const earned = Math.max(Math.floor(amountPaid / 20), 0)
  if (earned <= 0) return
  usePointsStore.getState().addTransaction({
    type: "booking_reward",
    amount: earned,
    reason: `Booking reward +${earned}`,
    entityId: bookingId,
    entityType: "booking",
  })
}

export function revokeBookingRewardPoints(bookingId: string, amountPaid: number) {
  const earned = Math.max(Math.floor(amountPaid / 20), 0)
  if (earned <= 0) return
  usePointsStore.getState().addTransaction({
    type: "booking_reward_revoked",
    amount: -Math.abs(earned),
    reason: `Revoked booking reward (${earned})`,
    entityId: bookingId,
    entityType: "booking",
  })
}

export function redeemPointsForBooking(bookingId: string, pointsUsed: number) {
  if (pointsUsed <= 0) return
  usePointsStore.getState().addTransaction({
    type: "points_redeemed",
    amount: -Math.abs(pointsUsed),
    reason: `Redeemed ${pointsUsed} points`,
    entityId: bookingId,
    entityType: "booking",
  })
}

export function refundRedeemedPoints(bookingId: string, pointsUsed: number) {
  if (pointsUsed <= 0) return
  usePointsStore.getState().addTransaction({
    type: "points_refund",
    amount: Math.abs(pointsUsed),
    reason: `Refund for cancelled booking`,
    entityId: bookingId,
    entityType: "booking",
  })
}

