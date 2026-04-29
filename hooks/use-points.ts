"use client"

import { useCallback, useEffect, useState } from "react"

import { usePointsStore } from "@/lib/points-store"
import { getMyPoints } from "@/lib/services/points.service"
import type { PointsTransaction } from "@/lib/types/points"

const USE_MOCK_UNCONNECTED_FEATURES =
  process.env.NEXT_PUBLIC_MOCK_UNCONNECTED_FEATURES === "true"

export function usePoints() {
  const localBalance = usePointsStore((s) => s.balance)
  const localTransactions = usePointsStore((s) => s.transactions)
  const localHasHydrated = usePointsStore((s) => s.hasHydrated)

  const [apiBalance, setApiBalance] = useState(0)
  const [apiTransactions, setApiTransactions] = useState<PointsTransaction[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  const refreshPoints = useCallback(async () => {
    if (USE_MOCK_UNCONNECTED_FEATURES) {
      setApiLoading(false)
      return
    }

    try {
      setApiLoading(true)
      setApiError(null)

      const data = await getMyPoints()

      setApiBalance(Number(data.balance ?? 0))
      setApiTransactions(data.transactions ?? [])
    } catch (error) {
      console.error("Failed to load points", error)
      setApiError("Failed to load points")
      setApiBalance(0)
      setApiTransactions([])
    } finally {
      setApiLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshPoints()
  }, [refreshPoints])

  if (USE_MOCK_UNCONNECTED_FEATURES) {
    return {
      balance: localBalance,
      transactions: localTransactions,
      hasHydrated: localHasHydrated,
      isLoading: !localHasHydrated,
      error: null,
      refreshPoints,
    }
  }

  return {
    balance: apiBalance,
    transactions: apiTransactions,
    hasHydrated: !apiLoading,
    isLoading: apiLoading,
    error: apiError,
    refreshPoints,
  }
}