"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Camera,
  Edit2,
  Star,
  Trophy,
  Calendar,
  Award,
  Heart,
  MapPin,
  Target,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppShell } from "@/components/layout/app-shell"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useTranslate } from "@/hooks/use-translate"
import { useAuth } from "@/hooks/use-auth"
import { useFavoritePlaygrounds } from "@/hooks/use-favorite-playgrounds"
import { useProfileDashboard } from "@/hooks/use-profile-dashboard"
import { usePoints } from "@/hooks/use-points"

export default function ProfilePage() {
  const { user, hasHydrated, isAuthenticated, updateUser } = useAuth()
  const { balance: pointsBalance, hasHydrated: pointsHydrated } = usePoints()
  const { t, language } = useTranslate()
  const {
    playgrounds: favorites,
    loading: favoritesLoading,
    removeFavorite,
  } = useFavoritePlaygrounds()
  const { dashboard, loading: dashboardLoading } = useProfileDashboard()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [formError, setFormError] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    position: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!hasHydrated) return

    setFormData({
      fullName: user.fullName || "",
      username: user.username || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      position: user.position || "",
    })
  }, [hasHydrated, user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      updateUser({
        avatar: event.target?.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = () => {
    const cleanedFullName = formData.fullName.trim()
    const cleanedUsername = formData.username.trim()
    const cleanedEmail = formData.email.trim()
    const cleanedPhone = formData.phoneNumber.trim()
    const cleanedPosition = formData.position.trim()

    if (!cleanedFullName || !cleanedUsername || !cleanedEmail || !cleanedPhone) {
      setFormError("Please fill full name, username, email and phone number.")
      return
    }

    updateUser({
      fullName: cleanedFullName,
      username: cleanedUsername,
      email: cleanedEmail,
      phoneNumber: cleanedPhone,
      position: cleanedPosition || user.position || "Player",
    })

    setFormError("")
    setEditDialogOpen(false)
  }

  const earnedBadges = dashboard?.badges.filter((b) => b.earned) ?? []
  const unearnedBadges = dashboard?.badges.filter((b) => !b.earned) ?? []

  if (!hasHydrated || !pointsHydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("profile.loading")}</p>
        </div>
      </AppShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <p className="text-muted-foreground">{t("profile.loginRequired")}</p>
          <Button className="mt-4" asChild>
            <Link href="/auth/signin">{t("auth.signIn")}</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  if (favoritesLoading || dashboardLoading || !dashboard) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("profile.loading")}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a472a] via-[#2d5a3f] to-[#1a472a] p-1 shadow-2xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
              <div className="relative rounded-xl bg-gradient-to-br from-[#1a472a]/90 to-[#0d2818]/90 p-6">
                <div className="absolute left-4 top-4">
                  <div className="text-5xl font-black text-[#c4a84f]">
                    {dashboard.meta.rating}
                  </div>
                  <div className="mt-1 rounded bg-[#c4a84f]/20 px-2 py-0.5 text-center text-xs font-bold uppercase tracking-wider text-[#c4a84f]">
                    {user.position || "Player"}
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-b from-[#c4a84f]/30 to-transparent" />
                    <Avatar className="h-36 w-36 border-4 border-[#c4a84f]/50">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-[#2d5a3f] text-4xl font-bold text-[#c4a84f]">
                        {(user.fullName || "P").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#c4a84f] text-[#1a472a] shadow-lg transition-transform hover:scale-110"
                    >
                      <Camera className="h-5 w-5" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-2xl font-bold text-white">{user.fullName}</h2>
                  <p className="text-sm text-[#c4a84f]">@{user.username}</p>
                  <p className="mt-1 text-xs text-white/70">{user.email}</p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#c4a84f]/20 pt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {dashboard.meta.stats.pace}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#c4a84f]/80">
                      PAC
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {dashboard.meta.stats.shooting}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#c4a84f]/80">
                      SHO
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {dashboard.meta.stats.passing}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#c4a84f]/80">
                      PAS
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {dashboard.meta.stats.dribbling}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#c4a84f]/80">
                      DRI
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {dashboard.meta.stats.defense}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#c4a84f]/80">
                      DEF
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {dashboard.meta.stats.physical}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#c4a84f]/80">
                      PHY
                    </div>
                  </div>
                </div>

                <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-[#c4a84f]/20 px-4 py-2">
                  <Star className="h-5 w-5 fill-[#c4a84f] text-[#c4a84f]" />
                  <span className="text-lg font-bold text-[#c4a84f]">
                    {pointsBalance.toLocaleString()}
                  </span>
                  <span className="text-sm text-[#c4a84f]/80">
                    {t("profile.points")}
                  </span>
                </div>
              </div>
            </div>

            <Card className="mt-4 bg-card">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {dashboard.meta.gameStats.matchesPlayed}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("profile.matches")}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {dashboard.meta.gameStats.wins}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("profile.wins")}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {dashboard.meta.gameStats.goals}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("profile.goals")}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {dashboard.meta.gameStats.tournamentsWon}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("profile.trophies")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-4 w-full gap-2">
                  <Edit2 className="h-4 w-4" /> {t("profile.editProfile")}
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("profile.editProfileTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("profile.editProfileDescription")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {formError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormError("")
                        setFormData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">{t("profile.username")}</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => {
                        setFormError("")
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormError("")
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">{t("auth.phoneNumber")}</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        setFormError("")
                        setFormData((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">{t("profile.position")}</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      placeholder="Player"
                      onChange={(e) => {
                        setFormError("")
                        setFormData((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormError("")
                      setEditDialogOpen(false)
                    }}
                  >
                    {t("common.cancel")}
                  </Button>

                  <Button onClick={handleSaveProfile}>
                    {t("profile.saveChanges")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  {t("profile.badges")}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <TooltipProvider>
                  <div className="mb-4">
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      {t("profile.earned").replace(
                        "{count}",
                        String(earnedBadges.length),
                      )}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {earnedBadges.map((badge) => {
                        const Icon = badge.icon

                        return (
                          <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl ${badge.color} shadow-lg transition-transform hover:scale-110`}
                              >
                                <Icon className="h-7 w-7 text-white" />
                              </div>
                            </TooltipTrigger>

                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-semibold">{t(badge.nameKey)}</p>
                              <p className="text-xs text-muted-foreground">
                                {t(badge.descriptionKey)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      {t("profile.locked").replace(
                        "{count}",
                        String(unearnedBadges.length),
                      )}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {unearnedBadges.map((badge) => {
                        const Icon = badge.icon

                        return (
                          <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                              <div className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl bg-muted opacity-50 transition-transform hover:scale-110">
                                <Icon className="h-7 w-7 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>

                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-semibold">{t(badge.nameKey)}</p>
                              <p className="text-xs text-muted-foreground">
                                {t(badge.descriptionKey)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  {t("profile.myFavorites")}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {favorites.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {favorites.map((playground) => (
                      <div
                        key={playground.id}
                        className="group relative overflow-hidden rounded-xl border bg-card"
                      >
                        <div className="relative h-32 overflow-hidden">
                          <Image
                            src={playground.imageUrl}
                            alt={playground.name[language]}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          <button
                            type="button"
                            onClick={() => removeFavorite(playground.id)}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="p-3">
                          <h4 className="font-semibold text-foreground">
                            {playground.name[language]}
                          </h4>

                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {playground.location[language]}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {playground.rating}
                              </span>
                            </div>

                            <span className="text-sm font-semibold text-primary">
                              {playground.price.min}-{playground.price.max}{" "}
                              {t("common.egp")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Heart className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <p className="mt-3 font-medium text-foreground">
                      {t("profile.noFavorites")}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("profile.saveFavorites")}
                    </p>

                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/playgrounds">
                        {t("profile.browsePlaygrounds")}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("profile.recentActivity")}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {dashboard.activity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border bg-card p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                          {activity.type === "booking" && (
                            <Calendar className="h-5 w-5 text-primary" />
                          )}
                          {activity.type === "tournament" && (
                            <Trophy className="h-5 w-5 text-primary" />
                          )}
                          {activity.type === "match" && (
                            <Target className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-foreground">
                            {t(activity.titleKey)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t(activity.dateKey)}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                        {activity.points}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-center">
                  <Button variant="outline" asChild>
                    <Link href="/bookings">{t("profile.viewAllActivity")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}