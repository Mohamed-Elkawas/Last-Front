"use client"

import type React from "react"
import { TrendingUp, TrendingDown, Calendar, Users, Clock, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useOwnerKPIs } from "@/hooks/use-owner-analytics"

type KPIKind = "count" | "percent"

interface KPICardProps {
  label: string
  value: string | number
  kind: KPIKind
  trend?: number
  icon: React.ComponentType<{ className?: string }>
}

function KPICard({ label, value, kind, trend = 0, icon: Icon }: KPICardProps) {
  const { t } = useAppTranslations()
  const isPositive = trend > 0
  const hasTrend = trend !== 0

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold text-foreground">
                {value}
              </h3>

              {kind === "percent" && (
                <span className="text-sm text-muted-foreground">%</span>
              )}
            </div>

            {hasTrend ? (
              <div className="flex items-center gap-1 text-xs">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}

                <span className={isPositive ? "text-green-600" : "text-red-600"}>
                  {Math.abs(trend)}%{" "}
                  {t(isPositive ? "ownerAnalytics.trendUp" : "ownerAnalytics.trendDown")}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("ownerAnalytics.noChange")}
              </p>
            )}
          </div>

          <div className="rounded-full bg-green-100 p-3">
            <Icon className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OwnerStatsCards() {
  const { t } = useAppTranslations()
  const { kpis, isLoading, error } = useOwnerKPIs()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border bg-card">
            <CardContent className="h-36 animate-pulse p-6" />
          </Card>
        ))}
      </div>
    )
  }

  if (error || !kpis) {
    return null
  }

  const stats = [
    {
      label: t("ownerAnalytics.todayBookings"),
      value: kpis.todayBookingsCount,
      kind: "count" as const,
      trend: kpis.todayBookingsTrend,
      icon: Calendar,
    },
    {
      label: t("ownerAnalytics.totalBookings"),
      value: kpis.totalBookingsCount,
      kind: "count" as const,
      trend: 0,
      icon: Users,
    },
    {
      label: t("ownerAnalytics.noShowRate"),
      value: kpis.noShowRate,
      kind: "percent" as const,
      trend: 0,
      icon: Clock,
    },
    {
      label: t("ownerAnalytics.utilizationRate"),
      value: kpis.utilizationRate,
      kind: "percent" as const,
      trend: kpis.utilizationTrend,
      icon: Target,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <KPICard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          kind={stat.kind}
          trend={stat.trend}
          icon={stat.icon}
        />
      ))}
    </div>
  )
}