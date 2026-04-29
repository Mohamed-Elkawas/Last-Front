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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import { useTranslate } from "@/hooks/use-translate"
import { useNotifications } from "@/hooks/use-notifications"
import type { NotificationType } from "@/lib/types/notification"

export default function NotificationsPage() {
  const { t, language } = useTranslate()
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "unread">("newest")

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "payment_submitted":
        return CreditCard
      case "booking_created":
      case "booking_approved":
      case "booking_rejected":
        return Calendar
      case "booking_cancelled":
        return X
      case "tournament_joined":
      case "tournament_created":
        return Trophy
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
      case "booking_approved":
        return "bg-blue-500"
      case "booking_cancelled":
      case "booking_rejected":
        return "bg-red-500"
      case "tournament_joined":
      case "tournament_created":
        return "bg-yellow-500"
      case "owner_booking_request":
      case "owner_booking_payment":
      case "owner_tournament_registration":
        return "bg-cyan-600"
      default:
        return "bg-primary"
    }
  }

  const formatTimestamp = (createdAt: string) => {
    const locale = language === "ar" ? "ar-EG" : "en-US"

    return new Date(createdAt).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (sortBy === "unread" && a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1
      }

      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()

      if (sortBy === "oldest") {
        return aTime - bTime
      }

      return bTime - aTime
    })
  }, [notifications, sortBy])

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

          {unreadCount > 0 ? (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="me-2 h-4 w-4" />
              {t("notifications.markAllRead")}
            </Button>
          ) : null}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  {t("notifications.tabNotifications")}
                </span>

                {unreadCount > 0 ? (
                  <Badge variant="secondary">{unreadCount}</Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-8 w-8 animate-pulse text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  جاري تحميل الإشعارات...
                </h3>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : sortedNotifications.length > 0 ? (
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
                                  onClick={() => {
                                    if (!notification.isRead) {
                                      markAsRead(notification.id)
                                    }
                                  }}
                                >
                                  {t("notifications.viewAction")}
                                </Link>
                              ) : null}
                            </div>

                            {!notification.isRead ? (
                              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            ) : null}
                          </div>
                        </div>

                        {!notification.isRead ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}