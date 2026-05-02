"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, MapPin, Star } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePlayground } from "@/hooks/use-playgrounds"
import { useTranslate } from "@/hooks/use-translate"

export default function PlaygroundDetailsPage() {
  const params = useParams()
  const { language, t } = useTranslate()
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined

  const { playground, loading, error } = usePlayground(id)

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      </AppShell>
    )
  }

  if (!playground) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-10">
          <Button variant="ghost" asChild className="mb-6 gap-2">
            <Link href="/playgrounds">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>

          <Card>
            <CardContent className="p-8">
              <h1 className="text-2xl font-semibold">Field not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {error?.message || "Field not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/playgrounds">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-3xl border bg-card">
            <div className="relative h-80">
              <Image
                src={playground.imageUrl}
                alt={playground.name[language]}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h1 className="text-3xl font-semibold">{playground.name[language]}</h1>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{playground.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{playground.location[language]}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {playground.pitchSizes.map((size) => (
                  <Badge key={size} variant="secondary">
                    {size}
                  </Badge>
                ))}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("homePage.pricePerHour")}</p>
                <p className="text-2xl font-bold text-primary">
                  {playground.price.min}-{playground.price.max} {t("common.egp")}
                </p>
              </div>

              {playground.amenities.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {playground.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              <Button asChild className="w-full">
                <Link href={`/playgrounds/${playground.id}/book`}>{t("playgrounds.book")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
