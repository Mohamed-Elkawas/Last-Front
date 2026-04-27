"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Bell,
  CreditCard,
  Calendar,
  ClipboardList,
  Trophy,
  UserPlus,
  X,
  Check,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell } from "@/components/layout/app-shell"
import { useTranslate } from "@/hooks/use-translate"
import { useNotifications } from "@/hooks/use-notifications"
import type { NotificationType } from "@/lib/types/notification"

export default function NotificationsPage() {
  const { t, language } = useTranslate()
  const {
    items,
    unreadCount,
    settings,
    hasHydrated,
    setSetting,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications()

  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "unread">("newest")

  const notificationSettings = useMemo(
    () => [
      {
        id: "booking" as const,
        label: t("notifications.bookingEvents"),
        description: t("notifications.bookingEventsDesc"),
      },
      {
        id: "tournament" as const,
        label: t("notifications.tournamentEvents"),
        description: t("notifications.tournamentEventsDesc"),
      },
      {
        id: "owner" as const,
        label: t("notifications.ownerEvents"),
        description: t("notifications.ownerEventsDesc"),
      },
      {
        id: "system" as const,
        label: t("notifications.systemEvents"),
        description: t("notifications.systemEventsDesc"),
      },
    ],
    [t],
  )

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "payment_submitted":
        return CreditCard
      case "booking_created":
        return Calendar
      case "booking_cancelled":
        return X
      case "tournament_joined":
      case "tournament_created":
        return Trophy
      case "booking_approved":
      case "booking_rejected":
        return UserPlus
      case "owner_booking_request":
      case "owner_booking_payment":
      case "owner_tournament_registration":
        return ClipboardList
      default:
        return Bell
    }
  }

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case "payment_submitted":
        return "bg-green-500"
      case "booking_created":
        return "bg-blue-500"
      case "booking_cancelled":
        return "bg-red-500"
      case "tournament_joined":
      case "tournament_created":
        return "bg-yellow-500"
      case "booking_approved":
      case "booking_rejected":
        return "bg-purple-500"
      case "owner_booking_request":
      case "owner_booking_payment":
      case "owner_tournament_registration":
        return "bg-cyan-600"
      default:
        return "bg-primary"
    }
  }

  const formatTimestamp = (createdAt: number) => {
    const locale = language === "ar" ? "ar-EG" : "en-US"

    return new Date(createdAt).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const sortedNotifications = [...items].sort((a, b) => {
    if (sortBy === "unread" && a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1
    }

    if (sortBy === "oldest") {
      return a.createdAt - b.createdAt
    }

    return b.createdAt - a.createdAt
  })

  const subtitle =
    unreadCount === 0
      ? t("notifications.allCaughtUp")
      : unreadCount === 1
        ? t("notifications.unreadOne")
        : t("notifications.unreadMany", { count: unreadCount })

  const sortLabel = (key: "newest" | "oldest" | "unread") => {
    if (key === "newest") return t("notifications.newest")
    if (key === "oldest") return t("notifications.oldest")
    return t("notifications.unread")
  }

  if (!hasHydrated) return null

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("notifications.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 ? (
              <Button variant="outline" onClick={clearAllNotifications}>
                <X className="me-2 h-4 w-4" />
                {t("notifications.clearAll")}
              </Button>
            ) : null}

            {unreadCount > 0 ? (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="me-2 h-4 w-4" />
                {t("notifications.markAllRead")}
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs defaultValue="notifications">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="gap-2">
              {t("notifications.tabNotifications")}
              {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
            </TabsTrigger>

            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              {t("notifications.tabSettings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("notifications.sortBy")}:
              </span>

              {(["newest", "oldest", "unread"] as const).map((option) => (
                <Button
                  key={option}
                  variant={sortBy === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option)}
                >
                  {sortLabel(option)}
                </Button>
              ))}
            </div>

            {sortedNotifications.length > 0 ? (
              <div className="space-y-3">
                {sortedNotifications.map((notification) => {
                  const Icon = getIcon(notification.type)

                  return (
                    <Card
                      key={notification.id}
                      className={`transition-colors ${
                        !notification.isRead ? "border-primary/30 bg-accent/30" : ""
                      }`}
                    >
                      <CardContent className="flex items-start gap-4 p-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getIconColor(
                            notification.type,
                          )}`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-medium text-foreground">
                                {notification.title}
                              </h3>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {notification.message}
                              </p>

                              <p className="mt-2 text-xs text-muted-foreground">
                                {formatTimestamp(notification.createdAt)}
                              </p>

                              {notification.actionHref ? (
                                <Link
                                  href={notification.actionHref}
                                  className="mt-2 inline-block text-xs text-primary hover:underline"
                                >
                                  {t("notifications.viewAction")}
                                </Link>
                              ) : null}
                            </div>

                            {!notification.isRead && (
                              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {t("notifications.emptyTitle")}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {t("notifications.emptySubtitle")}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("notifications.preferencesTitle")}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <Label htmlFor={setting.id} className="text-base font-medium">
                        {setting.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>

                    <Switch
                      id={setting.id}
                      checked={settings[setting.id]}
                      onCheckedChange={(checked) => setSetting(setting.id, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}