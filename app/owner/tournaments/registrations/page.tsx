"use client"

import Link from "next/link"
import { Trophy } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"

export default function OwnerTournamentRegistrationsPage() {
  const { language } = useAppTranslations()
  const isArabic = language === "ar"

  const labels = {
    title: isArabic ? "طلبات الانضمام للبطولات" : "Tournament Registrations",
    subtitle: isArabic
      ? "ستظهر طلبات الفرق هنا عندما يوفر الخادم واجهة مباشرة لقائمة التسجيلات."
      : "Team registration requests will appear here when the backend exposes a live registrations endpoint.",
    emptyTitle: isArabic ? "لا توجد بيانات مباشرة" : "No live data available",
    emptyBody: isArabic
      ? "عقد واجهة البطولات الحالي لا يتضمن نقطة نهاية لعرض طلبات التسجيل أو اعتمادها من هذه الصفحة."
      : "The current tournaments API contract does not include a live endpoint to list or review registration requests from this page.",
    back: isArabic ? "العودة للبطولات" : "Back to Tournaments",
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{labels.title}</h1>
            <p className="mt-2 text-muted-foreground">{labels.subtitle}</p>
          </div>

          <Button asChild variant="outline">
            <Link href="/owner/tournaments">{labels.back}</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">{labels.emptyTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{labels.emptyBody}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
