import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/features/backoffice/shared/components/status-badge"
import type { AlertRecord } from "@/features/backoffice/shared/types/entities"

type ActionCenterListProps = {
  title: string
  items: AlertRecord[]
}

function mapSeverityToTone(severity: AlertRecord["severity"]) {
  switch (severity) {
    case "low":
      return "info"
    case "medium":
      return "warning"
    case "high":
    case "critical":
      return "danger"
    default:
      return "neutral"
  }
}

export function ActionCenterList({ title, items }: ActionCenterListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.relatedEntityLabel}</p>
              </div>
              <StatusBadge label={item.severity} tone={mapSeverityToTone(item.severity)} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
