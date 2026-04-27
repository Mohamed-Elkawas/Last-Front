export type SeverityLevel = "low" | "medium" | "high" | "critical"

export type DataState<T> = {
  data: T
  isLoading: boolean
  error: string | null
}

export type TimelineItem = {
  id: string
  title: string
  description: string
  timestamp: string
  actor?: string
  severity?: SeverityLevel
}
