"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChangeEvent, FormEvent, useMemo, useState } from "react"
import {
  ArrowLeft,
  Camera,
  CalendarDays,
  CheckCircle2,
  Trophy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import { useAppTranslations } from "@/hooks/use-app-translations"
import { publishOwnerTournament } from "@/lib/services/owner-tournaments.service"

type TournamentFormat = "league" | "knockout" | "groups_knockout"
type TeamSize = "5x5" | "7x7"

export default function CreateTournamentPage() {
  const router = useRouter()
  const { language, hasHydrated } = useAppTranslations()

  const isArabic = language === "ar"

  const [coverPreview, setCoverPreview] = useState("")
  const [tournamentName, setTournamentName] = useState("")
  const [arena, setArena] = useState("Arena A - Main Stadium")

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [registrationDeadline, setRegistrationDeadline] = useState("")

  const [format, setFormat] = useState<TournamentFormat>("league")
  const [maxTeams, setMaxTeams] = useState("16")
  const [teamSize, setTeamSize] = useState<TeamSize>("5x5")

  const [entryFee, setEntryFee] = useState("")
  const [winnerPrize, setWinnerPrize] = useState("")
  const [runnerUpPrize, setRunnerUpPrize] = useState("")
  const [topScorerPrize, setTopScorerPrize] = useState("")
  const [goalkeeperPrize, setGoalkeeperPrize] = useState("")

  const [description, setDescription] = useState("")
  const [rules, setRules] = useState("")

  const canSubmit = useMemo(() => {
    return tournamentName.trim().length > 2 && Number(maxTeams) >= 2
  }, [tournamentName, maxTeams])

  const labels = {
    title: isArabic ? "إنشاء بطولة" : "Create Tournament",
    subtitle: isArabic
      ? "أدخل بيانات البطولة التي سيديرها صاحب الملعب."
      : "Fill in the tournament details managed by this owner.",
    uploadCover: isArabic ? "رفع صورة الغلاف" : "Upload Cover Image",
    tournamentName: isArabic ? "اسم البطولة" : "Tournament Name",
    arena: isArabic ? "اختيار الملعب" : "Select Arena",
    schedule: isArabic ? "المواعيد النهائية" : "Schedule & Deadlines",
    startDate: isArabic ? "تاريخ البداية" : "Start Date",
    endDate: isArabic ? "تاريخ النهاية" : "End Date",
    deadline: isArabic ? "آخر موعد للتسجيل" : "Registration Deadline",
    format: isArabic ? "نظام البطولة" : "Tournament Format",
    maxTeams: isArabic ? "عدد الفرق" : "Max Teams",
    teamSize: isArabic ? "حجم الفريق" : "Team Size",
    entryFee: isArabic ? "رسوم الاشتراك" : "Entry Fee",
    winner: isArabic ? "جائزة المركز الأول" : "Winner",
    runnerUp: isArabic ? "جائزة المركز الثاني" : "Runner-up",
    topScorer: isArabic ? "الهداف" : "Top scorer",
    goalkeeper: isArabic ? "أفضل حارس" : "Goalkeeper",
    description: isArabic ? "الوصف" : "Description",
    rules: isArabic ? "القواعد والشروط" : "Rules & Regulations",
    saveDraft: isArabic ? "حفظ كمسودة" : "Save Draft",
    create: isArabic ? "إنشاء البطولة" : "Create Tournament",
    back: isArabic ? "العودة للبطولات" : "Back to tournaments",
  }

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setCoverPreview(previewUrl)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    publishOwnerTournament({
      name: {
        en: tournamentName.trim(),
        ar: tournamentName.trim(),
      },
      description: {
        en: description.trim() || "—",
        ar: description.trim() || "—",
      },
      entryFeePerTeam: Math.max(0, Number(entryFee) || 0),
      maxTeams: Math.max(2, Math.min(64, Number(maxTeams) || 16)),
      scheduleLabel: {
        en: `${startDate || "TBD"} - ${endDate || "TBD"}`,
        ar: `${startDate || "غير محدد"} - ${endDate || "غير محدد"}`,
      },
      startDateLabel: {
        en: startDate || "TBD",
        ar: startDate || "غير محدد",
      },
      endDateLabel: {
        en: endDate || "TBD",
        ar: endDate || "غير محدد",
      },
      imageUrl: coverPreview,
      venueName: {
        en: arena,
        ar: arena,
      },
      prize: {
        first: Number(winnerPrize) || 0,
        second: Number(runnerUpPrize) || 0,
        bestPlayer: Number(topScorerPrize) || 0,
        bestGoalkeeper: Number(goalkeeperPrize) || 0,
      },
    })

    router.push("/owner/tournaments")
  }

  if (!hasHydrated) return null

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-3 px-0">
            <Link href="/owner/tournaments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {labels.back}
            </Link>
          </Button>

          <h1 className="text-3xl font-bold">{labels.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>

        <Badge className="w-fit bg-emerald-100 text-emerald-700">
          <Trophy className="mr-1 h-4 w-4" />
          {isArabic ? "بطولة جديدة" : "New Tournament"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label>{labels.uploadCover}</Label>

                <label className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 text-center transition hover:bg-emerald-50">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverPreview}
                      alt="Tournament cover"
                      className="h-full max-h-[320px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Camera className="h-10 w-10" />
                      <span className="text-sm font-medium">
                        {labels.uploadCover}
                      </span>
                    </div>
                  )}

                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{labels.tournamentName}</Label>
                  <Input
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder={
                      isArabic ? "مثال: بطولة الصيف" : "e.g. Summer Pro League"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{labels.arena}</Label>
                  <select
                    value={arena}
                    onChange={(e) => setArena(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option>Arena A - Main Stadium</option>
                    <option>Arena B - North Wing</option>
                    <option>Arena C - Training Field</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">{labels.schedule}</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{labels.startDate}</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{labels.endDate}</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{labels.deadline}</Label>
                  <Input
                    type="date"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <h2 className="text-xl font-semibold">
                {isArabic ? "تفاصيل البطولة" : "Tournament Details"}
              </h2>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-3">
                  <Label>{labels.format}</Label>

                  {[
                    ["league", isArabic ? "دوري" : "League"],
                    ["knockout", isArabic ? "خروج مغلوب" : "Knockout"],
                    [
                      "groups_knockout",
                      isArabic ? "مجموعات + خروج مغلوب" : "Groups + Knockout",
                    ],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormat(value as TournamentFormat)}
                      className={`w-full rounded-xl border p-4 text-start transition ${
                        format === value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-border bg-background"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label>{labels.maxTeams}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["8", "16", "32"].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMaxTeams(value)}
                        className={`rounded-xl border p-3 ${
                          maxTeams === value
                            ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                            : "border-border"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>

                  <Label className="block pt-4">{labels.teamSize}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["5x5", "7x7"].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTeamSize(value as TeamSize)}
                        className={`rounded-xl border p-3 ${
                          teamSize === value
                            ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                            : "border-border"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{labels.entryFee}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      placeholder="EGP 0.00"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="space-y-2">
                      <Label>{labels.winner}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={winnerPrize}
                        onChange={(e) => setWinnerPrize(e.target.value)}
                        placeholder="EGP 0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{labels.runnerUp}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={runnerUpPrize}
                        onChange={(e) => setRunnerUpPrize(e.target.value)}
                        placeholder="EGP 0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{labels.topScorer}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={topScorerPrize}
                        onChange={(e) => setTopScorerPrize(e.target.value)}
                        placeholder="EGP 0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{labels.goalkeeper}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={goalkeeperPrize}
                        onChange={(e) => setGoalkeeperPrize(e.target.value)}
                        placeholder="EGP 0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label>{labels.description}</Label>
                <Textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isArabic
                      ? "اكتب وصفًا واضحًا للبطولة..."
                      : "Tell teams what makes your tournament special..."
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{labels.rules}</Label>
                <Textarea
                  rows={6}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder={
                    isArabic
                      ? "مثال: الالتزام بالمواعيد - الأحذية الرياضية مطلوبة..."
                      : "Example: Fair play is mandatory - Stud shoes required..."
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="font-semibold">
                {isArabic ? "ملخص البطولة" : "Tournament Summary"}
              </h3>

              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{labels.tournamentName}: {tournamentName || "—"}</p>
                <p>{labels.arena}: {arena}</p>
                <p>{labels.format}: {format}</p>
                <p>{labels.maxTeams}: {maxTeams}</p>
                <p>{labels.teamSize}: {teamSize}</p>
                <p>{labels.entryFee}: {entryFee || 0} EGP</p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {isArabic
                  ? "سيتم إنشاء البطولة وإضافتها لقائمة البطولات."
                  : "Tournament will be created and added to your list."}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 md:flex-row lg:flex-col">
            <Button type="button" variant="outline" className="w-full">
              {labels.saveDraft}
            </Button>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {labels.create}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  )
}