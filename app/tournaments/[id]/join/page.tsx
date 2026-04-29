"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CreditCard,
  Mail,
  Phone,
  Plus,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { useAuth } from "@/hooks/use-auth"
import { useTranslate } from "@/hooks/use-translate"
import { useTournamentDetail } from "@/hooks/use-tournaments"
import { useTournamentInvitableUsers } from "@/hooks/use-tournament-invitable-users"
import { useRequireAuth } from "@/lib/auth/require-auth"
import { createTournamentRegistration } from "@/lib/services/tournaments.service"
import type { TournamentPaymentMethod } from "@/lib/types/tournament"
import type { InvitableUser } from "@/lib/types/tournament-invite"

type TeamMember = {
  username: string
  name: string
  avatar: string | null
}

type TournamentJoinDraft = {
  step: number
  teamName: string
  teamMembers: TeamMember[]
  paymentMethod: TournamentPaymentMethod
}

const DEFAULT_PAYMENT_METHOD: TournamentPaymentMethod = "vodafone_cash"

function isTournamentPaymentMethod(value: string): value is TournamentPaymentMethod {
  return value === "vodafone_cash" || value === "instapay"
}

function getLocalizedValue(
  value: { ar?: string; en?: string } | undefined,
  language: "ar" | "en",
) {
  if (!value) return ""
  return value[language] || value.en || value.ar || ""
}

export default function JoinTournamentPage() {
  const router = useRouter()
  const params = useParams()
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined

  const { t, language } = useTranslate()
  const { user, hasHydrated } = useAuth()
  const { isAuthenticated, canProceed } = useRequireAuth()

  const { tournament, loading: tournamentLoading, error: tournamentError } =
    useTournamentDetail(id)

  const { users: invitableUsers, loading: invitableLoading } =
    useTournamentInvitableUsers()

  const draftStorageKey = id ? `tournament-join-draft:${id}` : null

  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [step, setStep] = useState(1)
  const [teamName, setTeamName] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentMethod, setPaymentMethod] =
    useState<TournamentPaymentMethod>(DEFAULT_PAYMENT_METHOD)

  useEffect(() => {
    if (!isAuthenticated) {
      if (id) {
        canProceed("tournament_join", { tournamentId: id })
      }
      setShowAuthDialog(true)
    }
  }, [canProceed, id, isAuthenticated])

  useEffect(() => {
    if (!draftStorageKey || typeof window === "undefined") return

    const rawDraft = window.localStorage.getItem(draftStorageKey)
    if (!rawDraft) return

    try {
      const draft = JSON.parse(rawDraft) as Partial<TournamentJoinDraft>

      const restoredMembers = Array.isArray(draft.teamMembers)
        ? draft.teamMembers.filter(
            (member): member is TeamMember =>
              typeof member?.username === "string" &&
              typeof member?.name === "string" &&
              (typeof member?.avatar === "string" || member?.avatar === null),
          )
        : []

      setStep(
        typeof draft.step === "number" && draft.step >= 1 && draft.step <= 3
          ? draft.step
          : 1,
      )
      setTeamName(typeof draft.teamName === "string" ? draft.teamName : "")
      setTeamMembers(restoredMembers)
      setPaymentMethod(
        typeof draft.paymentMethod === "string" &&
          isTournamentPaymentMethod(draft.paymentMethod)
          ? draft.paymentMethod
          : DEFAULT_PAYMENT_METHOD,
      )
    } catch {
      window.localStorage.removeItem(draftStorageKey)
    }
  }, [draftStorageKey])

  useEffect(() => {
    if (!draftStorageKey || typeof window === "undefined") return

    const draft: TournamentJoinDraft = {
      step,
      teamName,
      teamMembers,
      paymentMethod,
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft))
  }, [draftStorageKey, paymentMethod, step, teamMembers, teamName])

  const currentUser = {
    id: user.username || user.email || "current-player",
    name: user.fullName || user.username || user.email || "",
    phone: user.phoneNumber || "",
    email: user.email || "",
    username: user.username || "",
    avatar: user.avatar || null,
  }

  const tournamentName = getLocalizedValue(tournament?.name, language)

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return invitableUsers.filter((registeredUser) => {
      const alreadyAdded = teamMembers.some(
        (member) => member.username === registeredUser.username,
      )

      if (alreadyAdded) return false
      if (!normalizedSearch) return true

      return (
        registeredUser.username.toLowerCase().includes(normalizedSearch) ||
        registeredUser.name.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [invitableUsers, searchQuery, teamMembers])

  const addMember = (registeredUser: InvitableUser) => {
    if (teamMembers.length >= 9) return

    setTeamMembers((current) => [
      ...current,
      {
        username: registeredUser.username,
        name: registeredUser.name,
        avatar: registeredUser.avatar ?? null,
      },
    ])

    setSearchOpen(false)
    setSearchQuery("")
  }

  const removeMember = (username: string) => {
    setTeamMembers((current) =>
      current.filter((member) => member.username !== username),
    )
  }

  const canProceedToStep2 = teamName.trim().length > 0 && teamMembers.length >= 4

  const handleCreateRegistration = async () => {
    const trimmedTeamName = teamName.trim()
    const playersCount = teamMembers.length + 1

    if (!tournament || !id || !trimmedTeamName || playersCount < 5) {
      setStep(2)
      return
    }

    if (!canProceed("tournament_join", { tournamentId: id })) {
      setShowAuthDialog(true)
      return
    }

    try {
      setSubmitting(true)
      setSubmitError(null)

      const result = await createTournamentRegistration({
        tournamentId: id,
        teamName: trimmedTeamName,
        players: [
          {
            id: currentUser.id,
            fullName: currentUser.name,
            username: currentUser.username,
            avatar: currentUser.avatar,
            isCaptain: true,
          },
          ...teamMembers.map((member) => ({
            id: member.username,
            fullName: member.name,
            username: member.username,
            avatar: member.avatar,
            isCaptain: false,
          })),
        ],
      })

      if (draftStorageKey && typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey)
      }

      router.push(
        `/tournaments/${id}/join/payment?registrationId=${result.registration.id}&method=${paymentMethod}`,
      )
    } catch (error) {
      if (error instanceof Error && error.message === "TEAM_NAME_ALREADY_EXISTS") {
        setStep(2)
        setSubmitError("اسم الفريق موجود بالفعل")
        return
      }

      setSubmitError("حدث خطأ أثناء الانضمام للبطولة")
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasHydrated || tournamentLoading || invitableLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-sm text-muted-foreground">
            {t("tournamentJoin.loading")}
          </p>
        </div>
      </AppShell>
    )
  }

  if (tournamentError) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-sm text-destructive">{tournamentError.message}</p>
          <Button className="mt-4" asChild>
            <Link href="/tournaments">{t("tournamentJoin.back")}</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  if (!tournament) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t("tournamentDetail.notFound") || "Tournament not found"}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/tournaments">{t("tournamentJoin.back")}</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href={`/tournaments/${id}`}>
            <ArrowLeft className="h-4 w-4 icon-arrow-back" />
            {t("tournamentJoin.back")}
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t("tournamentJoin.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{tournamentName}</p>
        </div>

        <div className="mb-8 flex items-center gap-4">
          {[1, 2, 3].map((currentStep) => (
            <div key={currentStep} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > currentStep ? <Check className="h-4 w-4" /> : currentStep}
              </div>

              <span
                className={`hidden text-sm sm:inline ${
                  step >= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {currentStep === 1 && t("tournamentJoin.stepProfile")}
                {currentStep === 2 && t("tournamentJoin.stepTeam")}
                {currentStep === 3 && t("tournamentJoin.stepPayment")}
              </span>

              {currentStep < 3 && (
                <div
                  className={`h-0.5 w-8 ${
                    step > currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("tournamentJoin.profileTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("tournamentJoin.profileHint")}
              </p>

              <div className="space-y-2">
                <Label>{t("profile.fullName")}</Label>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{currentUser.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("auth.phoneNumber")}</Label>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{currentUser.phone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("auth.email")}</Label>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{currentUser.email}</span>
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep(2)}>
                {t("tournamentJoin.continue")}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("tournamentJoin.teamTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="team-name">{t("tournamentJoin.teamName")}</Label>
                <Input
                  id="team-name"
                  placeholder={t("tournamentJoin.teamNamePh")}
                  value={teamName}
                  onChange={(event) => {
                    setTeamName(event.target.value)
                    setSubmitError(null)
                  }}
                />

                {submitError && (
                  <p className="mt-2 text-sm text-destructive">
                    {submitError}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <Label>
                    {t("tournamentJoin.membersLabel", {
                      count: teamMembers.length,
                    })}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {t("tournamentJoin.minSquad")}
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-accent/50 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatar || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {currentUser.name.charAt(0).toUpperCase() || "P"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{currentUser.username}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                    {t("tournamentJoin.captain")}
                  </span>
                </div>

                {teamMembers.map((member) => (
                  <div
                    key={member.username}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback className="bg-muted">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{member.username}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(member.username)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {teamMembers.length < 9 && (
                  <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        {t("tournamentJoin.addMember")}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={t("tournamentJoin.searchPh")}
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t("tournamentJoin.emptySearch")}
                          </CommandEmpty>

                          <CommandGroup>
                            {filteredUsers.map((registeredUser) => (
                              <CommandItem
                                key={registeredUser.username}
                                onSelect={() => addMember(registeredUser)}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-muted text-xs">
                                      {registeredUser.name
                                        .charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div>
                                    <p className="font-medium">
                                      {registeredUser.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      @{registeredUser.username}
                                    </p>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}

                {teamMembers.length < 4 && (
                  <p className="text-sm text-destructive">
                    {t("tournamentJoin.needMore", {
                      count: 4 - teamMembers.length,
                    })}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  {t("common.back")}
                </Button>

                <Button
                  className="flex-1"
                  disabled={!canProceedToStep2}
                  onClick={() => setStep(3)}
                >
                  {t("tournamentJoin.joinContinuePayment")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("tournamentJoin.paymentTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium">
                  {t("tournamentJoin.orderSummary")}
                </h4>

                <div className="mt-3 space-y-2">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {t("tournamentJoin.tournamentRow")}
                    </span>
                    <span className="text-end font-medium">{tournamentName}</span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {t("tournamentJoin.teamRow")}
                    </span>
                    <span className="text-end font-medium">{teamName}</span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {t("tournamentJoin.playersRow")}
                    </span>
                    <span className="text-end font-medium">
                      {teamMembers.length + 1}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">
                      {t("tournamentJoin.total")}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {tournament.entryFeePerTeam.toLocaleString()}{" "}
                      {t("common.egp")}
                    </span>
                  </div>
                </div>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => {
                  if (isTournamentPaymentMethod(value)) {
                    setPaymentMethod(value)
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <RadioGroupItem
                    value="vodafone_cash"
                    id="vodafone_cash"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="vodafone_cash"
                    className="flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {t("tournamentJoin.vodafoneTitle")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("tournamentJoin.vodafoneDesc")}
                      </p>
                    </div>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem
                    value="instapay"
                    id="instapay"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="instapay"
                    className="flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {t("tournamentJoin.instapayTitle")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("tournamentJoin.instapayDesc")}
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {submitError && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </p>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  disabled={submitting}
                  onClick={() => setStep(2)}
                >
                  {t("common.back")}
                </Button>

                <Button
                  className="flex-1"
                  disabled={
                    submitting ||
                    !canProceedToStep2 ||
                    !isTournamentPaymentMethod(paymentMethod) ||
                    tournament.entryFeePerTeam <= 0
                  }
                  onClick={handleCreateRegistration}
                >
                  {submitting
                    ? t("common.loading")
                    : t("tournamentJoin.continuePaymentDetails")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        cancelHref="/"
      />
    </AppShell>
  )
}