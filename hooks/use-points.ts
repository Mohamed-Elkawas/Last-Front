"use client"

import { usePointsStore } from "@/lib/points-store"

export function usePoints() {
  const balance = usePointsStore((s) => s.balance)
  const transactions = usePointsStore((s) => s.transactions)
  const hasHydrated = usePointsStore((s) => s.hasHydrated)

  return { balance, transactions, hasHydrated }
}

