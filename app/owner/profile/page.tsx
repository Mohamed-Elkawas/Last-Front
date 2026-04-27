"use client"
import { useState } from "react"
import Image from "next/image"
import { Building2, CreditCard, Phone, UserRound, Upload, Camera } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useOwnerProfile } from "@/hooks/use-owner-profile"


function asText(value: unknown): string {
  if (typeof value === "string") return value

  if (
    value &&
    typeof value === "object" &&
    ("ar" in value || "en" in value)
  ) {
    const localized = value as { ar?: string; en?: string }
    return localized.ar || localized.en || ""
  }

  return ""
}

export default function OwnerProfilePage() {
  const { t, hasHydrated } = useAppTranslations()
  const { personal, venue, setPersonal, setVenue } = useOwnerProfile()

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverFile(file)
    setVenue({ coverImageUrl: URL.createObjectURL(file) })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    setVenue({ avatarUrl: URL.createObjectURL(file) })
  }

  if (!hasHydrated) return null

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-44 w-full md:h-52">
          <Image src={venue.coverImageUrl} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4 border-white/20 bg-white/20 text-white hover:bg-white/30"
            onClick={() => document.getElementById("cover-upload")?.click()}
            type="button"
          >
            <Upload className="mr-2 h-4 w-4" />
            {t("ownerProfilePage.changeCover")}
          </Button>

          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        <div className="relative flex flex-col gap-4 px-6 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="-mt-14 flex items-end gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-xl">
              <Image src={venue.avatarUrl} alt={personal.fullName} fill className="object-cover" />

              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-white/20 bg-white/20 p-0 text-white hover:bg-white/30"
                onClick={() => document.getElementById("avatar-upload")?.click()}
                type="button"
              >
                <Camera className="h-4 w-4" />
              </Button>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("ownerProfilePage.kicker")}
              </p>
              <h1 className="text-2xl font-semibold text-foreground">{personal.fullName}</h1>
              <p className="text-sm text-muted-foreground">{asText(venue.playgroundName)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <UserRound className="h-5 w-5 text-primary" />
              {t("ownerProfilePage.ownerSection")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("ownerProfilePage.ownerSectionDesc")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">{t("ownerProfilePage.fullName")}</Label>
              <Input
                value={personal.fullName}
                onChange={(e) => setPersonal({ fullName: e.target.value })}
                className="border-border bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t("ownerProfilePage.email")}</Label>
              <Input
                type="email"
                value={personal.email}
                onChange={(e) => setPersonal({ email: e.target.value })}
                className="border-border bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t("ownerProfilePage.phone")}</Label>
              <Input
                value={personal.phone}
                onChange={(e) => setPersonal({ phone: e.target.value })}
                className="border-border bg-background text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              {t("ownerProfilePage.venueSection")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("ownerProfilePage.venueSectionDesc")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">{t("ownerProfilePage.playgroundName")}</Label>
              <Input
                value={asText(venue.playgroundName)}

                onChange={(e) => setVenue({ playgroundName: e.target.value })}
                className="border-border bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t("ownerProfilePage.location")}</Label>
              <Input
                value={asText(venue.location)}

                onChange={(e) => setVenue({ location: e.target.value })}
                className="border-border bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground">
                <Phone className="h-3.5 w-3.5" />
                {t("ownerProfilePage.venuePhone")}
              </Label>
              <Input
                value={asText(venue.venuePhone)}
                onChange={(e) => setVenue({ venuePhone: e.target.value })}
                className="border-border bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t("ownerProfilePage.workingHours")}</Label>
              <Input
                value={asText(venue.workingHours)}
                onChange={(e) => setVenue({ workingHours: e.target.value })}
                className="border-border bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t("ownerProfilePage.pitchTypes")}</Label>
              <Input
                value={asText(venue.pitchTypes)}
                onChange={(e) => setVenue({ pitchTypes: e.target.value })}
                className="border-border bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t("ownerProfilePage.about")}</Label>
              <Textarea
                value={asText(venue.about)}
                onChange={(e) => setVenue({ about: e.target.value })}
                className="border-border bg-background text-foreground"
                rows={4}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                {t("ownerProfilePage.paymentMethods")}
              </Label>
              <Textarea
                value={asText(venue.paymentMethodsNote)}
                onChange={(e) => setVenue({ paymentMethodsNote: e.target.value })}
                className="border-border bg-background text-foreground"
                rows={3}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground">{t("ownerProfilePage.coverUrl")}</Label>
                <Input
                  value={asText(venue.coverImageUrl)}
                  onChange={(e) => setVenue({ coverImageUrl: e.target.value })}
                  className="border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t("ownerProfilePage.avatarUrl")}</Label>
                <Input
                  value={asText(venue.avatarUrl)}
                  onChange={(e) => setVenue({ avatarUrl: e.target.value })}
                  className="border-border bg-background text-foreground"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t("ownerProfilePage.savedHint")}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t("ownerProfilePage.previewTitle")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("ownerProfilePage.previewSubtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground">{t("ownerProfilePage.previewLocation")}:</span>{" "}
            {asText(venue.location)}

          </p>
          <p>
            <span className="text-foreground">{t("ownerProfilePage.previewAbout")}:</span>{" "}
            {asText(venue.about)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
