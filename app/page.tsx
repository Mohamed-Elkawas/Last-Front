"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Search,
  Star,
  Trophy,
  Users,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useHomeFeatured } from "@/hooks/use-home-featured"
import { getPopularFields } from "@/lib/services/fields.api"
import { useRequireAuth } from "@/lib/auth/require-auth"
import type { Playground } from "@/lib/types/playground"

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { language, hasHydrated, messages, t, isArabic } = useAppTranslations()
  const { data: featured, loading: featuredLoading } = useHomeFeatured()
  const { canProceed } = useRequireAuth()
  const [popularFields, setPopularFields] = useState<Playground[]>([])
  const [popularLoading, setPopularLoading] = useState(true)
  const [popularError, setPopularError] = useState<Error | null>(null)

  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight
  const labels = {
    noFields: isArabic ? "لا توجد ملاعب متاحة" : "No fields available",
    noFieldsBody: isArabic
      ? "ستظهر الملاعب الشائعة هنا عند توفر ملاعب معتمدة."
      : "Popular fields will appear here once approved fields are available.",
    noUpcoming: isArabic ? "لا توجد بطولات قادمة" : "No upcoming tournaments",
    noUpcomingBody: isArabic
      ? "ستظهر البطولات القادمة هنا عند توفرها من الخادم."
      : "Upcoming tournaments will appear here once the backend returns published items.",
  }

  useEffect(() => {
    let isMounted = true
    setPopularLoading(true)
    setPopularError(null)

    getPopularFields(3)
      .then((fields) => {
        if (isMounted) {
          setPopularFields(fields)
        }
      })
      .catch((error) => {
        if (!isMounted) return
        setPopularError(error instanceof Error ? error : new Error(String(error)))
        setPopularFields([])
      })
      .finally(() => {
        if (isMounted) {
          setPopularLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const searchHref = useMemo(() => {
    return `/playgrounds${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`
  }, [searchQuery])

  const handleBookNow = (playgroundId: string) => {
    if (!canProceed("playground_book", { playgroundId })) {
      setShowAuthDialog(true)
      return
    }

    router.push(`/playgrounds/${playgroundId}/book`)
  }

  if (!hasHydrated || featuredLoading || popularLoading || !featured) {
    return (
      <AppShell>
        <div className="page-container py-10">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AppShell>
    )
  }

  const { tournaments: upcomingTournaments } = featured

  return (
    <AppShell>
      <section className="relative overflow-hidden">
        <div className="relative h-[500px] md:h-[540px]">
          <Image
            src="/images/hero-football.jpg"
            alt={t("homePage.heroAlt")}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/65" />

          <div className="relative flex h-full items-center">
            <div className="page-container">
              <div className="mx-auto max-w-4xl text-center">
                <h1 className="text-balance text-4xl font-extrabold leading-tight text-white md:text-6xl">
                  {messages.homePage.heroTitle}
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-lg">
                  {messages.homePage.heroSubtitle}
                </p>

                <div className="mx-auto mt-8 w-full max-w-xl rounded-full bg-white/95 p-2 shadow-2xl backdrop-blur">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-10 shrink-0 rounded-full px-5"
                      asChild
                    >
                      <Link href={searchHref}>
                        <Search className="h-4 w-4" />
                        {messages.common.search}
                      </Link>
                    </Button>

                    <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={messages.homePage.searchPlaceholder}
                        className="h-10 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container section-spacing">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-8 w-8" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {messages.homePage.startFriendlyMatch}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {messages.homePage.startFriendlyMatchSub}
                </p>
              </div>

              <Button asChild className="rounded-2xl">
                <Link href="/match/create">{messages.common.create}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Trophy className="h-8 w-8" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {messages.homePage.joinATournament}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {messages.homePage.joinATournamentSub}
                </p>
              </div>

              <Button asChild className="rounded-2xl">
                <Link href="/tournaments">{messages.common.joinCta}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="page-container pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">{messages.homePage.popularPlaygrounds}</h2>
            <p className="section-subtitle">
              {messages.homePage.popularPlaygroundsSub}
            </p>
            {popularError && popularFields.length === 0 && (
              <p className="mt-3 text-sm text-destructive">
                {popularError.message || t("common.unexpectedError")}
              </p>
            )}
          </div>

          <Button variant="ghost" asChild className="gap-2 rounded-2xl">
            <Link href="/playgrounds">
              {messages.common.viewAll}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {popularFields.length === 0 ? (
          <Card className="mt-8 rounded-3xl">
            <CardContent className="p-8">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MapPin className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>{labels.noFields}</EmptyTitle>
                  <EmptyDescription>
                    {labels.noFieldsBody}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" asChild>
                    <Link href="/playgrounds">{messages.common.viewAll}</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {popularFields.map((playground) => (
              <Card
                key={playground.id}
                className="group overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={playground.imageUrl}
                    alt={playground.name[language]}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">{playground.rating}</span>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="text-lg font-bold">{playground.name[language]}</h3>

                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{playground.location[language]}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {playground.pitchSizes.map((size) => (
                      <Badge key={size} variant="secondary" className="rounded-full">
                        {size}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-extrabold text-primary">
                        {playground.price.min}-{playground.price.max}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("homePage.pricePerHour")}
                      </div>
                    </div>

                    <Button size="sm" className="rounded-2xl" onClick={() => handleBookNow(playground.id)}>
                      {messages.common.bookNow}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="page-container pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">{messages.homePage.upcomingTournaments}</h2>
            <p className="section-subtitle">
              {messages.homePage.upcomingTournamentsSub}
            </p>
          </div>

          <Button variant="ghost" asChild className="gap-2 rounded-2xl">
            <Link href="/tournaments">
              {messages.common.viewAll}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {upcomingTournaments.length === 0 ? (
          <Card className="mt-8 rounded-3xl">
            <CardContent className="p-8">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Trophy className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>{labels.noUpcoming}</EmptyTitle>
                  <EmptyDescription>
                    {labels.noUpcomingBody}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {upcomingTournaments.map((tournament) => {
              const progress =
                tournament.numberOfTeams > 0
                  ? (tournament.teamsJoined / tournament.numberOfTeams) * 100
                  : 0
              const isFull = tournament.status === "full"

              return (
                <Card
                  key={tournament.id}
                  className="rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge
                          variant={isFull ? "secondary" : "default"}
                          className={!isFull ? "bg-primary text-primary-foreground" : ""}
                        >
                          {isFull ? t("common.full") : t("common.open")}
                        </Badge>

                        <h3 className="mt-3 text-xl font-bold">
                          {tournament.name[language]}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {tournament.type}
                        </p>
                      </div>

                      <div className="text-end">
                        <p className="text-sm text-muted-foreground">
                          {messages.common.prizePool}
                        </p>
                        <p className="text-lg font-extrabold text-primary">
                          {tournament.prize[language] || tournament.prize.en || tournament.prize.ar || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {messages.common.teamsJoined}
                        </span>
                        <span className="font-semibold">
                          {tournament.teamsJoined}/{tournament.numberOfTeams}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      className="mt-5 w-full rounded-2xl"
                      variant={isFull ? "secondary" : "default"}
                      disabled={isFull}
                      asChild={!isFull}
                    >
                      {isFull ? (
                        <span>{messages.common.tournamentFull}</span>
                      ) : (
                        <Link href={`/tournaments/${tournament.id}`}>
                          {messages.common.joinTournament}
                        </Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} cancelHref="/" />
    </AppShell>
  )
}
