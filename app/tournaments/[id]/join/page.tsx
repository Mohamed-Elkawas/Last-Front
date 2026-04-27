"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, User, Phone, Mail, Users, Plus, X, Check, CreditCard, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AppShell } from "@/components/layout/app-shell"
import { AuthRequiredDialog } from "@/components/auth/auth-required-dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslate } from "@/hooks/use-translate"
import { useAuth } from "@/hooks/use-auth"
import { useTournamentDetail } from "@/hooks/use-tournaments"
import { useTournamentInvitableUsers } from "@/hooks/use-tournament-invitable-users"
import { useRequireAuth } from "@/lib/auth/require-auth"
import { createTournamentBooking } from "@/lib/services/bookings.service"
import type { PaymentMethod } from "@/lib/types/booking"
import type { InvitableUser } from "@/lib/types/tournament-invite"

interface TeamMember {
  username: string
  name: string
  avatar: string | null
}

type TournamentJoinDraft = {
  step: number
  teamName: string
  teamMembers: TeamMember[]
  paymentMethod: PaymentMethod
}

const DEFAULT_TOURNAMENT_PAYMENT_METHOD: PaymentMethod = "vodafone"

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === "vodafone" || value === "instapay"
}

export default function JoinTournamentPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined
  const { tournament, loading: tournamentLoading } = useTournamentDetail(id)
  const { t, language } = useTranslate()
  const { user, hasHydrated } = useAuth()
  const { users: invitableUsers, loading: invitableLoading } = useTournamentInvitableUsers()
  const { isAuthenticated, canProceed } = useRequireAuth()
  const draftStorageKey = id ? `tournament-join-draft:${id}` : null
  const [showAuthDialog, setShowAuthDialog] = useState(() => !isAuthenticated)

  // Guard: If guest visits this page, show auth dialog
  useEffect(() => {
    if (!isAuthenticated) {
      if (id) {
        canProceed("tournament_join", { tournamentId: id })
      }
      setShowAuthDialog(true)
    }
  }, [canProceed, id, isAuthenticated])

  const [step, setStep] = useState(1)
  const [teamName, setTeamName] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(DEFAULT_TOURNAMENT_PAYMENT_METHOD)

  const currentUser = {
    name: user.fullName,
    phone: user.phoneNumber,
    email: user.email,
    username: user.username,
    avatar: user.avatar || null,
  }

  const filteredUsers = invitableUsers.filter(
    (registeredUser) =>
      !teamMembers.find((m) => m.username === registeredUser.username) &&
      (registeredUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        registeredUser.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const addMember = (registeredUser: InvitableUser) => {
    if (teamMembers.length < 10) {
      setTeamMembers([...teamMembers, registeredUser])
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  const removeMember = (username: string) => {
    setTeamMembers(teamMembers.filter((m) => m.username !== username))
  }

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
      const paymentMethodFromDraft = draft.paymentMethod
      const restoredPaymentMethod: PaymentMethod =
        typeof paymentMethodFromDraft === "string" && isPaymentMethod(paymentMethodFromDraft)
          ? paymentMethodFromDraft
          : DEFAULT_TOURNAMENT_PAYMENT_METHOD

      setStep(typeof draft.step === "number" && draft.step >= 1 && draft.step <= 3 ? draft.step : 1)
      setTeamName(typeof draft.teamName === "string" ? draft.teamName : "")
      setTeamMembers(restoredMembers)
      setPaymentMethod(restoredPaymentMethod)
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

  const handleContinueToPaymentPage = () => {
    const trimmedTeamName = teamName.trim()
    const playersCount = teamMembers.length + 1
    const total = tournament?.entryFeePerTeam ?? 0

    if (!tournament || !id || !trimmedTeamName || playersCount < 5 || total <= 0 || !isPaymentMethod(paymentMethod)) {
      if (!trimmedTeamName || playersCount < 5) {
        setStep(2)
      }
      return
    }

    if (!canProceed("tournament_join", { tournamentId: id })) {
      setShowAuthDialog(true)
      return
    }

    const bookingId = createTournamentBooking({
      tournamentId: id,
      tournamentName: tournament.name,
      teamName: trimmedTeamName,
      players: playersCount,
      total,
      paymentMethod,
    })

    if (draftStorageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(draftStorageKey)
    }

    router.push(`/tournaments/${id}/join/payment?bookingId=${bookingId}`)
  }

  const canProceedToStep2 = teamName.trim().length > 0 && teamMembers.length >= 4

  if (!hasHydrated || invitableLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("tournamentJoin.loading")}</p>
        </div>
      </AppShell>
    )
  }

  if (tournamentLoading || !tournament) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-sm text-muted-foreground">{t("tournamentJoin.loading")}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link href={`/tournaments/${params.id}`}>
            <ArrowLeft className="h-4 w-4 icon-arrow-back" />
            {t("tournamentJoin.back")}
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("tournamentJoin.title")}</h1>
          <p className="mt-2 text-muted-foreground">{tournament.name[language]}</p>
        </div>

        <div className="mb-8 flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className={`hidden text-sm sm:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 && t("tournamentJoin.stepProfile")}
                {s === 2 && t("tournamentJoin.stepTeam")}
                {s === 3 && t("tournamentJoin.stepPayment")}
              </span>
              {s < 3 && <div className={`h-0.5 w-8 ${step > s ? "bg-primary" : "bg-muted"}`} />}
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
              <p className="text-sm text-muted-foreground">{t("tournamentJoin.profileHint")}</p>

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
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <Label>{t("tournamentJoin.membersLabel", { count: teamMembers.length })}</Label>
                  <span className="text-sm text-muted-foreground">{t("tournamentJoin.minSquad")}</span>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-accent/50 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatar || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                    {t("tournamentJoin.captain")}
                  </span>
                </div>

                {teamMembers.map((member) => (
                  <div key={member.username} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback className="bg-muted">{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">@{member.username}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeMember(member.username)}>
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
                          <CommandEmpty>{t("tournamentJoin.emptySearch")}</CommandEmpty>
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
                                      {registeredUser.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{registeredUser.name}</p>
                                    <p className="text-sm text-muted-foreground">@{registeredUser.username}</p>
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
                    {t("tournamentJoin.needMore", { count: 4 - teamMembers.length })}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  {t("common.back")}
                </Button>
                <Button className="flex-1" disabled={!canProceedToStep2} onClick={() => setStep(3)}>
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
                <h4 className="font-medium">{t("tournamentJoin.orderSummary")}</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{t("tournamentJoin.tournamentRow")}</span>
                    <span className="text-end font-medium">{tournament.name[language]}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{t("tournamentJoin.teamRow")}</span>
                    <span className="text-end font-medium">{teamName}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{t("tournamentJoin.playersRow")}</span>
                    <span className="text-end font-medium">{teamMembers.length + 1}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">{t("tournamentJoin.total")}</span>
                    <span className="text-lg font-bold text-primary">
                      {tournament.entryFeePerTeam} {t("common.egp")}
                    </span>
                  </div>
                </div>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => {
                  if (isPaymentMethod(value)) {
                    setPaymentMethod(value)
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <RadioGroupItem value="vodafone" id="vodafone" className="peer sr-only" />
                  <Label
                    htmlFor="vodafone"
                    className="flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{t("tournamentJoin.vodafoneTitle")}</p>
                      <p className="text-sm text-muted-foreground">{t("tournamentJoin.vodafoneDesc")}</p>
                    </div>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="instapay" id="instapay" className="peer sr-only" />
                  <Label
                    htmlFor="instapay"
                    className="flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{t("tournamentJoin.instapayTitle")}</p>
                      <p className="text-sm text-muted-foreground">{t("tournamentJoin.instapayDesc")}</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  {t("common.back")}
                </Button>
                <Button
                  className="flex-1"
                  disabled={!canProceedToStep2 || !isPaymentMethod(paymentMethod) || tournament.entryFeePerTeam <= 0}
                  onClick={handleContinueToPaymentPage}
                >
                  {t("tournamentJoin.continuePaymentDetails")}
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
