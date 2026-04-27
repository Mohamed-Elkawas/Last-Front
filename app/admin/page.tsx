"use client"

import { useMemo } from "react"
import { CircleAlert, ShieldAlert, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActionCenterList } from "@/features/backoffice/shared/components/action-center-list"
import { DataTableShell } from "@/features/backoffice/shared/components/data-table-shell"
import { EmptyState } from "@/features/backoffice/shared/components/empty-state"
import { LoadingState } from "@/features/backoffice/shared/components/loading-state"
import { StatsCard } from "@/features/backoffice/shared/components/stats-card"
import { StatusBadge } from "@/features/backoffice/shared/components/status-badge"
import { useAdminOverview } from "@/features/backoffice/admin/hooks/use-admin-overview"
import { useAdminUsers } from "@/features/backoffice/admin/hooks/use-admin-users"

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-white md:text-3xl">{title}</h1>
      <p className="max-w-3xl text-sm text-slate-400">{description}</p>
    </div>
  )
}

function getStatusTone(status: string) {
  switch (status) {
    case "active":
      return "success"
    case "suspended":
      return "danger"
    case "inactive":
      return "warning"
    default:
      return "neutral"
  }
}

export default function AdminOverviewPage() {
  const overview = useAdminOverview()
  const users = useAdminUsers()

  const statCards = [
    { title: "Total Users", value: overview.data.totalUsers.toLocaleString() },
    { title: "Active Users", value: overview.data.activeUsers.toLocaleString() },
    { title: "Total Bookings", value: overview.data.totalBookings.toLocaleString() },
    { title: "Confirmed Bookings", value: overview.data.confirmedBookings.toLocaleString() },
    { title: "Platform Revenue", value: `${overview.data.totalRevenue.toLocaleString()} EGP` },
    { title: "Platform Commission", value: `${overview.data.platformCommission.toLocaleString()} EGP` },
    { title: "Open Disputes", value: overview.data.disputeCount.toLocaleString() },
  ]

  const alertItems = useMemo(
    () => [
      {
        id: "admin-alert-disputes",
        type: "anomaly" as const,
        title: "Open dispute workload",
        description: `${overview.data.disputeCount} dispute cases currently require platform attention.`,
        severity: "high" as const,
        status: "open" as const,
        relatedEntityLabel: "Disputes queue",
        createdAt: new Date().toISOString(),
      },
      {
        id: "admin-alert-risk",
        type: "fraud_candidate" as const,
        title: "Suspicious activity alerts",
        description: `${overview.data.suspiciousActivityAlerts} alerts need review from risk operations.`,
        severity: "critical" as const,
        status: "acknowledged" as const,
        relatedEntityLabel: "Risk monitoring",
        createdAt: new Date().toISOString(),
      },
      {
        id: "admin-alert-bookings",
        type: "anomaly" as const,
        title: "Platform booking review",
        description: `${(overview.data.totalBookings - overview.data.confirmedBookings).toLocaleString()} bookings remain outside the confirmed pipeline and should be monitored.`,
        severity: "medium" as const,
        status: "open" as const,
        relatedEntityLabel: "Booking oversight",
        createdAt: new Date().toISOString(),
      },
    ],
    [
      overview.data.confirmedBookings,
      overview.data.disputeCount,
      overview.data.suspiciousActivityAlerts,
      overview.data.totalBookings,
    ]
  )

  const previewUsers = useMemo(() => users.data.slice(0, 5), [users.data])

  const columns = [
    {
      key: "user",
      header: "User",
      render: (user: (typeof previewUsers)[number]) => (
        <div className="space-y-1">
          <div className="font-medium text-white">{user.fullName}</div>
          <div className="text-xs text-slate-400">@{user.username}</div>
        </div>
      ),
    },
    {
      key: "activity",
      header: "Activity Summary",
      render: (user: (typeof previewUsers)[number]) => (
        <span className="text-sm text-slate-300">{user.activitySummary}</span>
      ),
    },
    {
      key: "bookings",
      header: "Bookings",
      render: (user: (typeof previewUsers)[number]) => (
        <span className="text-sm text-white">{user.bookingsCount}</span>
      ),
    },
    {
      key: "payments",
      header: "Payment Total",
      render: (user: (typeof previewUsers)[number]) => (
        <span className="text-sm text-white">{user.paymentTotal.toLocaleString()} EGP</span>
      ),
    },
    {
      key: "flags",
      header: "Flags",
      render: (user: (typeof previewUsers)[number]) => (
        <span className="text-sm text-white">{user.suspiciousFlags}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: (typeof previewUsers)[number]) => (
        <StatusBadge label={user.status} tone={getStatusTone(user.status)} />
      ),
    },
  ]

  const isLoading = overview.isLoading || users.isLoading
  const error = overview.error || users.error
  const isEmpty = !statCards.some((card) => card.value) && previewUsers.length === 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Admin Overview"
        description="Monitor platform health, surface operational risk, and review a quick snapshot of user activity from the control center."
      />

      {isLoading ? (
        <LoadingState rows={6} />
      ) : error ? (
        <EmptyState icon={CircleAlert} title="Unable to load admin overview" description={error} />
      ) : isEmpty ? (
        <EmptyState
          icon={ShieldAlert}
          title="No admin overview data"
          description="There is no platform summary data available right now."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatsCard key={card.title} title={card.title} value={card.value} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <ActionCenterList title="Risk & Alerts" items={alertItems} />

            <Card className="border-slate-800 bg-slate-900/45 text-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Users className="h-5 w-5 text-cyan-400" />
                  Platform User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewUsers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No users to preview"
                    description="There are no users available in the current admin preview list."
                  />
                ) : (
                  <DataTableShell
                    columns={columns}
                    rows={previewUsers}
                    getRowId={(user) => user.id}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
