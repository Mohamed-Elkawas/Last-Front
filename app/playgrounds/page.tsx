"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, MapPin, Star, X, ChevronDown, Heart } from "lucide-react"

import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { format } from "date-fns"
import { useTranslate } from "@/hooks/use-translate"
import { getDateFnsLocale } from "@/lib/i18n/date-locale"
import { useFavoritePlaygrounds } from "@/hooks/use-favorite-playgrounds"
import { getFields, searchFields } from "@/lib/services/fields.api"
import { useRequireAuth } from "@/lib/auth/require-auth"
import { EGYPT_GOVERNORATES } from "@/lib/constants/egypt-governorates"
import type { EgyptGovernorateKey, Playground } from "@/lib/types/playground"

const pitchSizes = ["5v5", "7v7", "11v11"]

type PlaygroundWithSource = Playground & {
  __fromApi: true
}

function markApiPlaygrounds(playgrounds: Playground[]): PlaygroundWithSource[] {
  return playgrounds.map((playground) => ({
    ...playground,
    __fromApi: true,
  }))
}

function PlaygroundsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useTranslate()
  const { isFavorite, toggleFavorite, hasHydrated: favoritesHydrated } =
    useFavoritePlaygrounds()
  const { canProceed } = useRequireAuth()
  const dateLocale = useMemo(() => getDateFnsLocale(language), [language])

  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "")
  const [selectedGovernorate, setSelectedGovernorate] =
    useState<EgyptGovernorateKey>("all")
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")

  const [allPlaygrounds, setAllPlaygrounds] = useState<PlaygroundWithSource[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<Error | null>(null)

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? ""
    setSearchQuery((current) => (current === nextQuery ? current : nextQuery))
  }, [searchParams])

  useEffect(() => {
    let isMounted = true

    async function fetchPlaygrounds() {
      setCatalogLoading(true)
      setCatalogError(null)

      try {
        const apiResults = searchQuery.trim()
          ? await searchFields(searchQuery.trim())
          : await getFields()

        if (isMounted) {
          setAllPlaygrounds(markApiPlaygrounds(apiResults))
        }
      } catch (error) {
        if (!isMounted) return

        setCatalogError(error instanceof Error ? error : new Error(String(error)))
        setAllPlaygrounds([])
      } finally {
        if (isMounted) {
          setCatalogLoading(false)
        }
      }
    }

    fetchPlaygrounds()

    return () => {
      isMounted = false
    }
  }, [searchQuery])

  const timeOptions = useMemo(
    () => [
      { value: "all", label: t("playgroundsUi.timeAll") },
      { value: "morning", label: t("playgroundsUi.timeMorning") },
      { value: "afternoon", label: t("playgroundsUi.timeAfternoon") },
      { value: "evening", label: t("playgroundsUi.timeEvening") },
      { value: "night", label: t("playgroundsUi.timeNight") },
    ],
    [t],
  )

  const sortOptions = useMemo(
    () => [
      { value: "relevance", label: t("playgroundsUi.sortRelevance") },
      { value: "price-low", label: t("playgroundsUi.sortPriceLow") },
      { value: "price-high", label: t("playgroundsUi.sortPriceHigh") },
      { value: "rating", label: t("playgroundsUi.sortRating") },
    ],
    [t],
  )

  const filteredAndSortedPlaygrounds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    let results = allPlaygrounds.filter((playground) => {
      if (!q) return true

      const nameAr = playground.name.ar.toLowerCase()
      const nameEn = playground.name.en.toLowerCase()
      const locationAr = playground.location.ar.toLowerCase()
      const locationEn = playground.location.en.toLowerCase()

      return (
        nameAr.includes(q) ||
        nameEn.includes(q) ||
        locationAr.includes(q) ||
        locationEn.includes(q)
      )
    })

    if (selectedGovernorate !== "all") {
      const expected = selectedGovernorate.toLowerCase().replace(/-/g, " ")
      results = results.filter((playground) => {
        const cityKey = playground.cityKey?.toLowerCase().replace(/-/g, " ") ?? ""
        const location = `${playground.location.en} ${playground.location.ar}`.toLowerCase()
        return cityKey.includes(expected) || location.includes(expected)
      })
    }

    if (selectedSizes.length > 0) {
      results = results.filter((playground) =>
        selectedSizes.some((size) => playground.pitchSizes.includes(size)),
      )
    }

    switch (sortBy) {
      case "price-low":
        results = [...results].sort((a, b) => a.price.min - b.price.min)
        break
      case "price-high":
        results = [...results].sort((a, b) => b.price.max - a.price.max)
        break
      case "rating":
        results = [...results].sort((a, b) => b.rating - a.rating)
        break
      default:
        break
    }

    return results
  }, [allPlaygrounds, searchQuery, sortBy])

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedGovernorate("all")
    setSelectedSizes([])
    setSelectedDate(undefined)
    setSelectedTime("all")
    setSortBy("relevance")
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedGovernorate !== "all" ||
    selectedSizes.length > 0 ||
    Boolean(selectedDate) ||
    selectedTime !== "all"

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const handleBookNow = (playgroundId: string) => {
    const playground = allPlaygrounds.find((p) => p.id === playgroundId)

    if (!playground?.__fromApi) {
      return
    }

    if (!canProceed("playground_book", { playgroundId })) {
      setShowAuthDialog(true)
      return
    }

    router.push(`/playgrounds/${playgroundId}/book`)
  }

  const count = filteredAndSortedPlaygrounds.length
  const resultsSuffix = language === "en" ? (count === 1 ? "" : "s") : ""

  if (catalogLoading || !favoritesHydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t("playgrounds.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("playgrounds.subtitle")}
          </p>

          {catalogError && (
            <p className="mt-4 text-sm text-destructive">
              {catalogError.message || t("common.unexpectedError")}
            </p>
          )}
        </div>

        <div className="mb-8 space-y-5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <button
              type="submit"
              aria-label="Search"
              className="absolute start-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
            >
              <Search className="h-5 w-5" />
            </button>

            <Input
              type="search"
              placeholder={t("playgrounds.searchPlaceholder")}
              className="h-12 rounded-full ps-12 pe-4 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={selectedGovernorate}
              onValueChange={(value) =>
                setSelectedGovernorate(value as EgyptGovernorateKey)
              }
            >
              <SelectTrigger className="h-9 w-[200px] rounded-full sm:w-[220px]">
                <SelectValue placeholder={t("playgrounds.selectGovernorate")} />
              </SelectTrigger>

              <SelectContent>
                {EGYPT_GOVERNORATES.map((governorate) => (
                  <SelectItem key={governorate.key} value={governorate.key}>
                    {language === "ar" ? governorate.ar : governorate.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="hidden h-6 w-px bg-border sm:block" />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-full"
                >
                  {selectedDate
                    ? format(selectedDate, "MMM d, yyyy", {
                        locale: dateLocale,
                      })
                    : t("playgrounds.selectDate")}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="h-9 w-[200px] rounded-full sm:w-[220px]">
                <SelectValue placeholder={t("playgroundsUi.selectTime")} />
              </SelectTrigger>

              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {t("playgrounds.pitchSize")}
            </span>

            {pitchSizes.map((size) => (
              <Button
                key={size}
                variant={selectedSizes.includes(size) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSize(size)}
                className="h-9 rounded-full"
              >
                {size}
              </Button>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ms-auto gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                {t("playgrounds.clearFilters")}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("playgrounds.resultsCount", { count, suffix: resultsSuffix })}
          </p>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-full rounded-lg sm:w-[220px]">
              <span className="text-sm text-muted-foreground">
                {t("playgrounds.sortBy")}
              </span>
              <SelectValue />
            </SelectTrigger>

            <SelectContent align="end">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedPlaygrounds.map((playground) => {
            const favorite = isFavorite(playground.id)

            return (
              <Card
                key={playground.id}
                className="group overflow-hidden bg-card transition-shadow hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={playground.imageUrl}
                    alt={playground.name[language]}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorite(playground.id)
                    }}
                    className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition-all hover:scale-110"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        favorite
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>

                  <div className="absolute bottom-3 start-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-foreground">
                      {playground.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({playground.reviewCount} {t("playgroundsUi.reviews")})
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">
                    <Link href={`/playgrounds/${playground.id}`} className="hover:text-primary">
                      {playground.name[language]}
                    </Link>
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="text-sm">
                      {playground.location[language]}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {playground.pitchSizes.map((size) => (
                      <Badge key={size} variant="secondary" className="text-xs">
                        {size}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div>
                      <span className="text-lg font-bold text-primary">
                        {playground.price.min}-{playground.price.max}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        {t("playgrounds.priceUnit")}
                      </span>
                    </div>

                    <Button size="sm" onClick={() => handleBookNow(playground.id)}>
                      {t("playgrounds.book")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredAndSortedPlaygrounds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {t("playgrounds.noResultsTitle")}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {t("playgrounds.noResultsDescription")}
            </p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {t("playgrounds.clearAllFilters")}
            </Button>
          </div>
        )}

        <AuthRequiredDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          cancelHref="/"
        />
      </div>
    </AppShell>
  )
}

export default function PlaygroundsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="mx-auto max-w-7xl px-6 py-8">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </AppShell>
      }
    >
      <PlaygroundsPageContent />
    </Suspense>
  )
}
