import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatsCardProps = {
  title: string
  value: string | number
  description?: string
  meta?: string
}

export function StatsCard({ title, value, description, meta }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
      </CardContent>
    </Card>
  )
}
