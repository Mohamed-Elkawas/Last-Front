"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTranslate } from "@/hooks/use-translate"
import { useNotificationsStore } from "@/lib/notifications-store"

export default function NotificationSettingsPage() {
  const { t } = useTranslate()

  const settings = useNotificationsStore((state) => state.settings)
  const setSetting = useNotificationsStore((state) => state.setSetting)

  const items = [
    {
      key: "booking",
      label: t("notifications.bookingEvents"),
      description: t("notifications.bookingEventsDesc"),
    },
    {
      key: "tournament",
      label: t("notifications.tournamentEvents"),
      description: t("notifications.tournamentEventsDesc"),
    },
    {
      key: "owner",
      label: t("notifications.ownerEvents"),
      description: t("notifications.ownerEventsDesc"),
    },
    {
      key: "system",
      label: t("notifications.systemEvents"),
      description: t("notifications.systemEventsDesc"),
    },
  ] as const

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">
          {t("notifications.settingsTitle")}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("notifications.preferencesTitle")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex w-full items-center gap-4 rounded-2xl border bg-background p-4"
              >
                {/* النص */}
                <div className="min-w-0 flex-1 text-start">
                  <Label className="text-base font-medium">
                    {item.label}
                  </Label>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                {/* الحل هنا 👇 */}
                <div dir="ltr" className="shrink-0">
                  <Switch
                    checked={settings[item.key]}
                    onCheckedChange={(checked) =>
                      setSetting(item.key, checked)
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}