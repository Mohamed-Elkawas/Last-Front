"use client"

import { useEffect, useState } from "react"
import type { DataState } from "@/features/backoffice/shared/types/common"

type MockResourceOptions<T> = {
  initialData: T
  loadDelayMs?: number
  shouldFail?: boolean
  errorMessage?: string
}

export function useMockResource<T>({
  initialData,
  loadDelayMs = 250,
  shouldFail = false,
  errorMessage = "Unable to load mock resource",
}: MockResourceOptions<T>): DataState<T> {
  const [state, setState] = useState<DataState<T>>({
    data: initialData,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (shouldFail) {
        setState((current) => ({
          ...current,
          isLoading: false,
          error: errorMessage,
        }))

        return
      }

      setState({
        data: initialData,
        isLoading: false,
        error: null,
      })
    }, loadDelayMs)

    return () => window.clearTimeout(timer)
  }, [errorMessage, initialData, loadDelayMs, shouldFail])

  return state
}
