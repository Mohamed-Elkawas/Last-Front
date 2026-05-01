"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Save, Settings } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useOwnerTournamentsStore } from "@/lib/owner-tournaments-store"

type LocalizedText = string | { en?: string; ar?: string } | null | undefined

function getLocalizedText(value: LocalizedText, language: "en" | "ar") {
  if (!value) return ""
  if (typeof value === "string") return value
  return value[language] ?? value.ar ?? value.en ?? ""
}

export default function OwnerTournamentSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const tournamentId = String(params.id)

  const { language, hasHydrated } = useAppTranslations()
  const isArabic = language === "ar"

  const tournaments = useOwnerTournamentsStore((state) => state.tournaments)

  const tournament = tournaments.find((item) => item.id === tournamentId)

  const [name, setName] = useState("")
  const [fee, setFee] = useState("")
  const [maxTeams, setMaxTeams] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const labels = {
    back: isArabic ? "العودة لإدارة البطولة" : "Back to workspace",
    title: isArabic ? "تعديل البطولة" : "Edit Tournament",
    subtitle: isArabic
      ? "عدّل بيانات البطولة الأساسية ثم احفظ التغييرات."
      : "Update the tournament basic information and save changes.",
    name: isArabic ? "اسم البطولة" : "Tournament Name",
    fee: isArabic ? "رسوم الاشتراك" : "Entry Fee",
    maxTeams: isArabic ? "عدد الفرق" : "Max Teams",
    description: isArabic ? "وصف البطولة" : "Description",
    save: isArabic ? "حفظ التعديلات" : "Save Changes",
    saving: isArabic ? "جاري الحفظ..." : "Saving...",
    notFound: isArabic ? "البطولة غير موجودة" : "Tournament not found",
    notFoundDesc: isArabic
      ? "ربما تم حذف البطولة أو أن الرابط غير صحيح."
      : "The tournament may have been deleted or the link is invalid.",
  }

  useEffect(() => {
    if (!tournament) return

    setName(getLocalizedText(tournament.name, language))
    setFee(String(tournament.entryFeePerTeam ?? 0))
    setMaxTeams(String(tournament.maxTeams ?? 16))
    setDescription(getLocalizedText(tournament.description, language))
  }, [tournament, language])

  const handleSave = () => {
    if (!tournament) return
    if (!name.trim()) return

    setSaving(true)

    const current = useOwnerTournamentsStore.getState().tournaments

    const updated = current.map((item) => {
      if (item.id !== tournamentId) return item

      return {
        ...item,
        name: {
          en: name.trim(),
          ar: name.trim(),
        },
        description: {
          en: description.trim() || "—",
          ar: description.trim() || "—",
        },
        entryFeePerTeam: Math.max(0, Number(fee) || 0),
        maxTeams: Math.max(2, Math.min(64, Number(maxTeams) || 16)),
      }
    })

    useOwnerTournamentsStore.setState({
      tournaments: updated,
    })

    setSaving(false)
    router.push(`/owner/tournaments/${tournamentId}`)
  }

  if (!hasHydrated) return null

  return (
    <AppShell showNavbar={false}>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Button asChild variant="ghost" className="mb-4 px-0">
          <Link href={`/owner/tournaments/${tournamentId}`}>
            {isArabic ? (
              <ArrowRight className="ml-2 h-4 w-4" />
            ) : (
              <ArrowLeft className="mr-2 h-4 w-4" />
            )}
            {labels.back}
          </Link>
        </Button>

        {!tournament ? (
          <Card>
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <h1 className="text-2xl font-bold">{labels.notFound}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {labels.notFoundDesc}
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

              <p className="mt-2 text-sm text-muted-foreground">
                {labels.subtitle}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{labels.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>{labels.name}</Label>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={labels.name}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{labels.fee}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={fee}
                      onChange={(event) => setFee(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{labels.maxTeams}</Label>
                    <Input
                      type="number"
                      min={2}
                      max={64}
                      value={maxTeams}
                      onChange={(event) => setMaxTeams(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{labels.description}</Label>
                  <Textarea
                    rows={5}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={labels.description}
                  />
                </div>

                <Button
                  type="button"
                  disabled={saving || !name.trim()}
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                  {saving ? labels.saving : labels.save}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </AppShell>
  )
}