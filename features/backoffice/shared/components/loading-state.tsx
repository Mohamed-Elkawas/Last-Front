import { Skeleton } from "@/components/ui/skeleton"

type LoadingStateProps = {
  rows?: number
}

export function LoadingState({ rows = 4 }: LoadingStateProps) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  )
}
