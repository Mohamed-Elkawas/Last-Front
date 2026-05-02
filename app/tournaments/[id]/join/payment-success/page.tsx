"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslate } from "@/hooks/use-translate"

function Content() {
  const params = useParams()
  const { language } = useTranslate()
  const isArabic = language === "ar"
  const tournamentId = String(params.id)

  const labels = {
    title: isArabic ? "تم تنفيذ الطلب" : "Request Completed",
    body: isArabic
      ? "إذا تم تسجيل فريقك بنجاح فستظهر حالة الانضمام من بيانات الخادم عند توفرها."
      : "If your team was joined successfully, its status will appear once the backend exposes it through live data.",
    backTournament: isArabic ? "العودة للبطولة" : "Back to Tournament",
    backList: isArabic ? "العودة للبطولات" : "Back to Tournaments",
  }

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md rounded-2xl text-center shadow-sm">
          <CardContent className="p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>

            <h1 className="mt-6 text-2xl font-bold">{labels.title}</h1>
            <p className="mt-4 text-sm text-muted-foreground">{labels.body}</p>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild>
                <Link href={`/tournaments/${tournamentId}`}>{labels.backTournament}</Link>
              </Button>

              <Button asChild variant="outline">
                <Link href="/tournaments">{labels.backList}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function TournamentPaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  )
}
