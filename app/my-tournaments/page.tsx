"use client"

import Link from "next/link"
import { Trophy } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslate } from "@/hooks/use-translate"

export default function MyTournamentsPage() {
  const { language } = useTranslate()
  const isArabic = language === "ar"

  const labels = {
    title: isArabic ? "بطولاتي" : "My Tournaments",
    subtitle: isArabic
      ? "سيظهر سجل الانضمام إلى البطولات هنا عند توفره من واجهات Hagzaya."
      : "Your tournament join history will appear here when Hagzaya exposes it through the live API.",
    emptyTitle: isArabic ? "لا توجد بيانات متاحة" : "No live data available",
    emptyBody: isArabic
      ? "واجهة برمجة التطبيقات الحالية لا توفر قائمة مباشرة بتسجيلات اللاعب في البطولات."
      : "The current backend contract does not expose a live player registrations list for tournaments.",
    browse: isArabic ? "استعراض البطولات" : "Browse Tournaments",
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{labels.title}</h1>
            <p className="mt-2 text-muted-foreground">{labels.subtitle}</p>
          </div>

          <Button asChild>
            <Link href="/tournaments">{labels.browse}</Link>
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
