"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Settings } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useTournamentDetail } from "@/hooks/use-tournaments"

export default function OwnerTournamentSettingsPage() {
  const params = useParams()
  const tournamentId = String(params.id)
  const { language, hasHydrated } = useAppTranslations()
  const { tournament, loading, error } = useTournamentDetail(tournamentId)
  const isArabic = language === "ar"

  const labels = {
    back: isArabic ? "العودة لإدارة البطولة" : "Back to Workspace",
    title: isArabic ? "إعدادات البطولة" : "Tournament Settings",
    subtitle: isArabic
      ? "تعرض هذه الصفحة بيانات البطولة القادمة من الخادم. لا توجد نقطة نهاية مباشرة لتعديل البطولة حالياً."
      : "This page shows live tournament data from the backend. There is currently no live endpoint for updating tournaments.",
    notFound: isArabic ? "البطولة غير موجودة" : "Tournament not found",
    liveOnly: isArabic ? "قراءة فقط" : "Read Only",
    name: isArabic ? "اسم البطولة" : "Tournament Name",
    type: isArabic ? "النوع" : "Type",
    price: isArabic ? "السعر" : "Price",
    teams: isArabic ? "عدد الفرق" : "Number of Teams",
    fieldId: isArabic ? "الملعب" : "Field",
    description: isArabic ? "الوصف" : "Description",
    prize: isArabic ? "الجائزة" : "Prize",
  }

  if (!hasHydrated || loading) {
    return null
  }

  return (
    <AppShell showNavbar={false}>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Button asChild variant="ghost" className="mb-4 px-0">
          <Link href={`/owner/tournaments/${tournamentId}`}>
            {isArabic ? <ArrowRight className="ml-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
            {labels.back}
          </Link>
        </Button>

        {!tournament ? (
          <Card>
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <h1 className="text-2xl font-bold">{labels.notFound}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {error?.message || labels.notFound}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Settings className="h-7 w-7 text-emerald-600" />
                {labels.title}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">{labels.subtitle}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{labels.liveOnly}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm text-muted-foreground">{labels.name}</p>
                  <p className="mt-1 font-medium">
                    {tournament.name[language] || tournament.name.en || tournament.name.ar || "-"}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{labels.type}</p>
                    <p className="mt-1 font-medium">{tournament.type || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{labels.price}</p>
                    <p className="mt-1 font-medium">{tournament.price}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{labels.teams}</p>
                    <p className="mt-1 font-medium">{tournament.numberOfTeams}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{labels.fieldId}</p>
                    <p className="mt-1 font-medium">{tournament.fieldId ?? "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{labels.description}</p>
                  <p className="mt-1 font-medium">
                    {tournament.description[language] || tournament.description.en || tournament.description.ar || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{labels.prize}</p>
                  <p className="mt-1 font-medium">
                    {tournament.prize[language] || tournament.prize.en || tournament.prize.ar || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </AppShell>
  )
}
