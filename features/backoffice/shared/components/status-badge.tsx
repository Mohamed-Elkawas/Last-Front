import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info"

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
}

type StatusBadgeProps = {
  label: string
  tone?: StatusTone
  className?: string
}

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return <Badge className={cn(toneClasses[tone], className)}>{label}</Badge>
}
