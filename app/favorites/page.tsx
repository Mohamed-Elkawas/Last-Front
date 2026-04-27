"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Star, MapPin, Heart, Search } from "lucide-react"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslate } from "@/hooks/use-translate"
import { useFavoritePlaygrounds } from "@/hooks/use-favorite-playgrounds"
import { useRequireAuth } from "@/lib/auth/require-auth"

export default function FavoritesPage() {
  const router = useRouter()
  const { playgrounds, loading, removeFavorite } = useFavoritePlaygrounds()
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { t, isArabic, language } = useTranslate()
  const { canProceed } = useRequireAuth()

  const handleRemoveClick = (id: string) => {
    setSelectedId(id)
    setRemoveDialogOpen(true)
  }

  const handleConfirmRemove = () => {
    if (selectedId !== null) {
      removeFavorite(selectedId)
    }
    setRemoveDialogOpen(false)
    setSelectedId(null)
  }

  const handleBookNow = (playgroundId: string) => {
    if (!canProceed("playground_book", { playgroundId })) {
      setShowAuthDialog(true)
      return
    }

    router.push(`/playgrounds/${playgroundId}/book`)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("favorites.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("favorites.subtitle")}</p>
        </div>

        {playgrounds.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {playgrounds.map((playground) => (
              <Card key={playground.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={playground.imageUrl}
                    alt={playground.name[language]}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveClick(playground.id)}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Heart className="h-5 w-5 fill-destructive text-destructive" />
                  </button>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{playground.rating}</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-foreground">{playground.name[language]}</h3>
                  <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{playground.location[language]}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {playground.pitchSizes.map((size) => (
                      <Badge key={size} variant="secondary">
                        {size}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary">
                        {playground.price.min}-{playground.price.max}
                      </span>
                      <span className="text-sm text-muted-foreground"> {t("favorites.priceUnit")}</span>
                    </div>
                    <Button size="sm" onClick={() => handleBookNow(playground.id)}>
                      {t("common.bookNow")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-foreground">{t("favorites.emptyTitle")}</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("favorites.emptyDescription")}</p>
            <Button asChild>
              <Link href="/playgrounds">
                <Search className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} /> {t("favorites.findPlaygrounds")}
              </Link>
            </Button>
          </div>
        )}

        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("favorites.removeTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("favorites.removeDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("common.remove")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} cancelHref="/" />
      </div>
    </AppShell>
  )
}
