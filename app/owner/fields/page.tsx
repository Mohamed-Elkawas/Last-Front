"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Grid3x3,
  List,
  AlertCircle,
  Zap,
  BarChart3,
  CreditCard,
  Search,
  Filter,
  Trash2,
  Trophy,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { useAppTranslations } from "@/hooks/use-app-translations"
import { usePlaygroundsCatalog } from "@/hooks/use-playgrounds"
import { useOwnerAccess } from "@/hooks/use-owner-access"
import { useOwnerBookings } from "@/features/backoffice/owner/hooks/use-owner-bookings"
import { useOwnerAccessStore } from "@/lib/owner-access-store"
import { usePlaygroundsStore } from "@/lib/stores/playgrounds.store"
import {
  createPlayground,
  updatePlayground,
  deletePlayground,
} from "@/lib/services/playgrounds.service"

import { EmptyState } from "@/features/backoffice/shared/components/empty-state"
import { LoadingState } from "@/features/backoffice/shared/components/loading-state"

function PageHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

type ViewMode = "grid" | "list"
type ModalType = "pricing" | "blocking" | "create" | null
type Time = { hour: number; minute: number }

type NewFieldForm = {
  name: string
  location: string
  cityKey: string
  fieldType: "5v5" | "7v7" | "11v11"
  minPrice: string
  maxPrice: string
  amenities: string[]
  imageUrl: string
}

export default function FieldManagementPage() {
  const { t } = useAppTranslations()
  const router = useRouter()

  const {
    playgrounds,
    loading: playgroundsLoading,
    reload,
  } = usePlaygroundsCatalog()

  const { ownedPlaygroundIds, hasHydrated: ownerHydrated } = useOwnerAccess()
  const { data: bookingsData = [] } = useOwnerBookings()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [blockedDate, setBlockedDate] = useState("")
  const [blockedTimes, setBlockedTimes] = useState<Time[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [newFieldForm, setNewFieldForm] = useState<NewFieldForm>({
    name: "",
    location: "",
    cityKey: "Cairo",
    fieldType: "5v5",
    minPrice: "",
    maxPrice: "",
    amenities: [],
    imageUrl: "/images/playground-1.jpg",
  })

  const {
    userPlaygrounds,
    fieldPricing,
    blockedSlots,
    setFieldPricing,
    setBlockedSlots,
    updateUserPlayground,
    removeUserPlayground,
  } = usePlaygroundsStore()

  const safePlaygrounds = Array.isArray(playgrounds) ? playgrounds : []
  const safeBookings = Array.isArray(bookingsData) ? bookingsData : []
  const safeOwnedPlaygroundIds = Array.isArray(ownedPlaygroundIds)
    ? ownedPlaygroundIds
    : []

  const ownedPlaygrounds = useMemo(() => {
    if (safePlaygrounds.length === 0 || safeOwnedPlaygroundIds.length === 0) {
      return []
    }

    const idSet = new Set(safeOwnedPlaygroundIds)

    return safePlaygrounds.filter((playground) => idSet.has(playground.id))
  }, [safePlaygrounds, safeOwnedPlaygroundIds])

  const fieldsWithOccupancy = useMemo(() => {
    return ownedPlaygrounds.map((field) => {
      const fieldBookings = safeBookings.filter(
        (booking) =>
          (booking as any).fieldId === field.id ||
          (booking as any).playground?.id === field.id ||
          (booking as any).playgroundId === field.id,
      )

      const confirmedBookings = fieldBookings.filter(
        (booking) =>
          (booking as any).status === "confirmed" ||
          (booking as any).status === "completed" ||
          (booking as any).bookingStatus === "confirmed" ||
          (booking as any).bookingStatus === "completed",
      )

      const occupancy =
        fieldBookings.length > 0
          ? Math.round((confirmedBookings.length / fieldBookings.length) * 100)
          : 0

      const pricing = fieldPricing[field.id]
      const morningPrice = pricing?.morning ?? field.price?.min ?? 0
      const eveningPrice =
        pricing?.evening ?? field.price?.max ?? field.price?.min ?? 0

      return {
        ...field,
        occupancy,
        totalBookings: fieldBookings.length,
        confirmedBookings: confirmedBookings.length,
        basePricing: morningPrice,
        peakPricing: eveningPrice,
      }
    })
  }, [ownedPlaygrounds, safeBookings, fieldPricing])

  const activeFields = fieldsWithOccupancy.length

  const todayRevenue = fieldsWithOccupancy.reduce(
    (sum, field) => sum + field.confirmedBookings * field.basePricing,
    0,
  )

  const filteredFields = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    if (!keyword) return fieldsWithOccupancy

    return fieldsWithOccupancy.filter((field) => {
      const name = `${field.name?.en ?? ""} ${field.name?.ar ?? ""}`.toLowerCase()
      const location = `${field.location?.en ?? ""} ${field.location?.ar ?? ""
        }`.toLowerCase()

      return name.includes(keyword) || location.includes(keyword)
    })
  }, [fieldsWithOccupancy, searchTerm])

  const featuredField =
    filteredFields.length > 0 ? filteredFields[0] : null

  const selectedField = fieldsWithOccupancy.find(
    (field) => field.id === selectedFieldId,
  )

  const selectedBlockedSlots = useMemo(() => {
    if (!selectedFieldId || !blockedDate) return []

    return blockedSlots[`${selectedFieldId}_${blockedDate}`] ?? []
  }, [blockedSlots, selectedFieldId, blockedDate])

  const isLoading = playgroundsLoading || !ownerHydrated

  const canManageField = (fieldId: string) => {
    return safeOwnedPlaygroundIds.includes(fieldId)
  }

  const isValidBlockedDate = (value: string) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
  }

  const handleBlockedDateChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)

    let formatted = digits

    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`
    }

    if (digits.length > 6) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(
        6,
      )}`
    }

    setBlockedDate(formatted)
  }

  const handleNewField = () => {
    router.push("/auth/signup?accountType=owner")
  }

  const handleEditPricing = (fieldId: string) => {
    if (!canManageField(fieldId)) return

    setSelectedFieldId(fieldId)
    setOpenModal("pricing")
  }

  const handleBlockSlots = (fieldId: string) => {
    if (!canManageField(fieldId)) return

    setSelectedFieldId(fieldId)
    setOpenModal("blocking")
  }

  const handleCreateTournament = (fieldId: string) => {
    if (!canManageField(fieldId)) return

    router.push(`/owner/tournaments?fieldId=${fieldId}`)
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!canManageField(fieldId)) return

    const confirmed = window.confirm("Are you sure you want to delete this field?")

    if (!confirmed) return

    setIsSubmitting(true)

    try {
      await deletePlayground(fieldId)

      removeUserPlayground(fieldId)

      const ownerStore = useOwnerAccessStore.getState()
      const currentIds = ownerStore.ownedPlaygroundIds ?? []

      ownerStore.setOwnerApproved(currentIds.filter((id) => id !== fieldId))

      await reload()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSavePricing = async () => {
    if (!selectedFieldId || !canManageField(selectedFieldId)) return

    setIsSubmitting(true)

    try {
      const morning = Number(
        (document.getElementById("morningPrice") as HTMLInputElement)?.value ??
        0,
      )

      const evening = Number(
        (document.getElementById("eveningPrice") as HTMLInputElement)?.value ??
        0,
      )

      if (morning <= 0 || evening <= 0) return

      setFieldPricing(selectedFieldId, { morning, evening })

      updateUserPlayground(selectedFieldId, {
        price: {
          min: morning,
          max: evening,
        },
      })

      await updatePlayground(selectedFieldId, {
        price: {
          min: morning,
          max: evening,
        },
      })

      await reload()

      setOpenModal(null)
      setSelectedFieldId(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveBlockedSlots = async () => {
    if (!selectedFieldId || !canManageField(selectedFieldId)) return

    if (!isValidBlockedDate(blockedDate)) {
      window.alert("Please enter date as YYYY-MM-DD.")
      return
    }

    if (blockedTimes.length === 0) {
      window.alert("Please select at least one slot.")
      return
    }

    setIsSubmitting(true)

    try {
      const times = blockedTimes.map(
        (time) =>
          `${String(time.hour).padStart(2, "0")}:${String(
            time.minute,
          ).padStart(2, "0")}`,
      )

      const mergedTimes = Array.from(
        new Set([...selectedBlockedSlots, ...times]),
      ).sort()

      setBlockedSlots(selectedFieldId, blockedDate, mergedTimes)

      setOpenModal(null)
      setSelectedFieldId(null)
      setBlockedDate("")
      setBlockedTimes([])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateField = async () => {
    if (fieldsWithOccupancy.length >= 1) {
      window.alert("This owner already has an assigned playground.")
      return
    }

    if (
      !newFieldForm.name ||
      !newFieldForm.location ||
      !newFieldForm.minPrice ||
      !newFieldForm.maxPrice
    ) {
      return
    }

    setIsSubmitting(true)

    try {
      const createdPlayground = await createPlayground({
        name: {
          en: newFieldForm.name,
          ar: newFieldForm.name,
        },
        location: {
          en: newFieldForm.location,
          ar: newFieldForm.location,
        },
        cityKey: newFieldForm.cityKey,
        price: {
          min: Number(newFieldForm.minPrice),
          max: Number(newFieldForm.maxPrice),
        },
        rating: 0,
        reviewCount: 0,
        imageUrl: newFieldForm.imageUrl || "/images/playground-1.jpg",
        pitchSizes: [newFieldForm.fieldType],
        amenities: newFieldForm.amenities,
      })

      const ownerStore = useOwnerAccessStore.getState()
      const currentIds = ownerStore.ownedPlaygroundIds ?? []

      ownerStore.setOwnerApproved(
        Array.from(new Set([...currentIds, createdPlayground.id])),
      )

      setNewFieldForm({
        name: "",
        location: "",
        cityKey: "Cairo",
        fieldType: "5v5",
        minPrice: "",
        maxPrice: "",
        amenities: [],
        imageUrl: "/images/playground-1.jpg",
      })

      await reload()

      setOpenModal(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <PageHeader
          title={t("ownerFields.title")}
          description={t("ownerFields.subtitle")}
        />

        <LoadingState rows={5} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title={t("ownerFields.title")}
          description={t("ownerFields.subtitle")}
        />

        <Button
          onClick={handleNewField}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          {t("ownerFields.newField")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-2xl border-green-100">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Active Fields</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {activeFields.toString().padStart(2, "0")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-green-100">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Today&apos;s Revenue</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              ${todayRevenue}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search field name..."
            className="rounded-xl pl-9"
          />
        </div>

        <Button variant="outline" className="rounded-xl px-3">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {featuredField ? (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
            <div className="relative min-h-80 overflow-hidden">
              {featuredField.imageUrl ? (
                <img
                  src={featuredField.imageUrl}
                  alt={featuredField.name.en || featuredField.name.ar || "Field"}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    const target = event.target as HTMLImageElement

                    target.style.display = "none"
                    target.parentElement?.classList.add(
                      "bg-gradient-to-br",
                      "from-green-400",
                      "to-green-600",
                    )
                  }}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-green-400 to-green-600" />
              )}

              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="text-center text-white">
                  <div className="text-xl font-bold">
                    {featuredField.name.en || featuredField.name.ar}
                  </div>
                </div>
              </div>

              <div className="absolute left-4 top-4 flex flex-col gap-2">
                <div className="inline-block rounded bg-white px-3 py-1 text-xs font-bold text-green-700">
                  {t("ownerFields.premierField")}
                </div>

                <div className="inline-block rounded bg-white px-3 py-1 text-xs font-bold text-green-700">
                  {t("ownerFields.outdoor")}
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">
                  {featuredField.name.en || featuredField.name.ar}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("ownerFields.bookingRate")}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {featuredField.basePricing} EGP/hr
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("ownerFields.primeTime")}
                    </div>
                    <div className="text-2xl font-bold text-pink-600">
                      {featuredField.peakPricing} EGP/hr
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("ownerFields.occupancy")}
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {featuredField.occupancy}%
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("ownerFields.status")}
                    </div>
                    <div className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      • {t("ownerFields.available")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleEditPricing(featuredField.id)}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {t("ownerFields.editPricing")}
                </Button>

                <Button
                  onClick={() => handleBlockSlots(featuredField.id)}
                  variant="outline"
                >
                  {t("ownerFields.blockSlots")}
                </Button>

                <Button
                  onClick={() => handleCreateTournament(featuredField.id)}
                  className="bg-green-700 hover:bg-green-800"
                >
                  <Trophy className="h-4 w-4" />
                  Create Tourney
                </Button>

                <Button
                  onClick={() => handleDeleteField(featuredField.id)}
                  variant="outline"
                  disabled={isSubmitting}
                  className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Field
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={AlertCircle}
              title={t("ownerFields.noFields")}
              description={t("ownerFields.addFirstField")}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t("ownerFields.inventoryMatrix")}</CardTitle>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "outline"}
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "outline"}
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {filteredFields.length === 0 ? (
                <EmptyState
                  icon={AlertCircle}
                  title={t("ownerFields.noFields")}
                  description={t("ownerFields.addFirstField")}
                />
              ) : viewMode === "grid" ? (
                <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {filteredFields.map((field) => (
                    <Card key={field.id} className="min-w-0 overflow-hidden rounded-2xl">
                      <div className="relative h-32">
                        {field.imageUrl ? (
                          <img
                            src={field.imageUrl}
                            alt={field.name.en || field.name.ar || "Field"}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              const target = event.target as HTMLImageElement

                              target.style.display = "none"
                              target.parentElement?.classList.add(
                                "bg-gradient-to-br",
                                "from-green-300",
                                "to-green-500",
                              )
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-green-300 to-green-500" />
                        )}
                      </div>

                      <CardContent className="space-y-3 p-4">
                        <div className="space-y-1">
                          <h4 className="font-semibold">
                            {field.name.en || field.name.ar}
                          </h4>

                          <p className="text-sm text-muted-foreground">
                            {t("ownerFields.fieldCount", {
                              id: field.id.slice(-4).toUpperCase(),
                            })}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("ownerFields.basePricing")}
                            </span>
                            <span className="font-medium">
                              {field.basePricing} EGP/hr
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditPricing(field.id)}
                            variant="outline"
                            className="text-xs"
                          >
                            {t("ownerFields.editRates")}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleBlockSlots(field.id)}
                          >
                            {t("ownerFields.blockSlots")}
                          </Button>

                          <Button
                            size="sm"
                            className="min-w-0 gap-1 bg-green-700 text-xs hover:bg-green-800"
                          >
                            <Trophy className="h-3 w-3 shrink-0" />
                            <span className="truncate">Create Tourney</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="min-w-0 gap-1 border-red-200 bg-red-50 text-xs text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">Delete Field</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFields.map((field) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-semibold">
                            {field.name.en || field.name.ar}
                          </h4>

                          <p className="text-sm text-muted-foreground">
                            {t("ownerFields.fieldCount", {
                              id: field.id.slice(-4).toUpperCase(),
                            })}{" "}
                            • {field.basePricing} EGP/hr
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditPricing(field.id)}
                            variant="outline"
                          >
                            {t("ownerFields.editRates")}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBlockSlots(field.id)}
                          >
                            {t("ownerFields.blockSlots")}
                          </Button>

                          <Button
                            size="sm"
                            className="min-w-0 gap-1 bg-green-700 text-xs hover:bg-green-800"
                          >
                            <Trophy className="h-3 w-3 shrink-0" />
                            <span className="truncate">Create Tourney</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="min-w-0 gap-1 border-red-200 bg-red-50 text-xs text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">Delete Field</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-l-4 border-l-green-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-green-600" />
                {t("ownerFields.tacticalInsights")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {featuredField ? (
                <>
                  {featuredField.occupancy < 50 && (
                    <div className="space-y-2 rounded-lg border-l-2 border-orange-500 bg-orange-50 p-3">
                      <h4 className="text-xs font-bold text-orange-700">
                        {t("ownerFields.maintenanceSeeded")}
                      </h4>

                      <p className="text-sm text-orange-700">
                        {t("ownerFields.fieldUnderutilized", {
                          fieldName:
                            featuredField.name.en || featuredField.name.ar,
                        })}
                      </p>

                      <button
                        onClick={() => handleBlockSlots(featuredField.id)}
                        className="text-xs font-semibold text-orange-700 underline"
                      >
                        {t("ownerFields.actionMaintenance")}
                      </button>
                    </div>
                  )}

                  {featuredField.occupancy >= 80 && (
                    <div className="space-y-2 rounded-lg border-l-2 border-green-600 bg-green-50 p-3">
                      <h4 className="text-xs font-bold text-green-700">
                        {t("ownerFields.peakDemandAlert")}
                      </h4>

                      <p className="text-sm text-green-700">
                        {t("ownerFields.fieldHighlyBooked", {
                          fieldName:
                            featuredField.name.en || featuredField.name.ar,
                        })}
                      </p>

                      <button
                        onClick={() => handleEditPricing(featuredField.id)}
                        className="text-xs font-semibold text-green-700 underline"
                      >
                        {t("ownerFields.reviewRates")}
                      </button>
                    </div>
                  )}

                  {featuredField.occupancy >= 50 &&
                    featuredField.occupancy < 80 && (
                      <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                        <p className="text-sm text-gray-700">
                          {t("ownerFields.optimalLevels", {
                            occupancy: featuredField.occupancy,
                          })}
                        </p>
                      </div>
                    )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("ownerFields.addFirstField")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-green-600 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-green-600" />
                {t("ownerFields.smartSurge")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-foreground">
                {t("ownerFields.aiDetected")}
              </p>

              <Button className="w-full bg-green-600 hover:bg-green-700">
                <BarChart3 className="h-4 w-4" />
                {t("ownerFields.optimizeMyRates")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={openModal === "pricing"}
        onOpenChange={(open) => {
          if (!open) {
            setOpenModal(null)
            setSelectedFieldId(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("ownerFields.pricingModalTitle")}</DialogTitle>
            <DialogDescription>
              {t("ownerFields.pricingModalSubtitle", {
                fieldName: selectedField?.name.en || selectedField?.name.ar || "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="morningPrice">
                {t("ownerFields.morningPrice")}
              </Label>

              <p className="text-xs text-muted-foreground">
                {t("ownerFields.morningPriceHint")}
              </p>

              <Input
                id="morningPrice"
                type="number"
                placeholder="e.g., 200"
                defaultValue={
                  selectedField
                    ? fieldPricing[selectedField.id]?.morning ??
                    selectedField.price?.min ??
                    0
                    : 0
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eveningPrice">
                {t("ownerFields.eveningPrice")}
              </Label>

              <p className="text-xs text-muted-foreground">
                {t("ownerFields.eveningPriceHint")}
              </p>

              <Input
                id="eveningPrice"
                type="number"
                placeholder="e.g., 350"
                defaultValue={
                  selectedField
                    ? fieldPricing[selectedField.id]?.evening ??
                    selectedField.price?.max ??
                    selectedField.price?.min ??
                    0
                    : 0
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenModal(null)
                setSelectedFieldId(null)
              }}
            >
              {t("ownerFields.cancel")}
            </Button>

            <Button
              onClick={handleSavePricing}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting
                ? t("ownerFields.saving")
                : t("ownerFields.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openModal === "blocking"}
        onOpenChange={(open) => {
          if (!open) {
            setOpenModal(null)
            setSelectedFieldId(null)
            setBlockedDate("")
            setBlockedTimes([])
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("ownerFields.slottingModalTitle")}</DialogTitle>
            <DialogDescription>
              {t("ownerFields.slottingModalSubtitle", {
                fieldName: selectedField?.name.en || selectedField?.name.ar || "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blockedDate">
                {t("ownerFields.selectDate")}
              </Label>

              <Input
                id="blockedDate"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="YYYY-MM-DD"
                value={blockedDate}
                onChange={(event) => handleBlockedDateChange(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("ownerFields.selectSlots")}</Label>

              <p className="text-xs text-muted-foreground">
                Select time slots to block on {blockedDate || "selected date"}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 24 }, (_, hour) => {
                  const slotLabel = `${String(hour).padStart(2, "0")}:00`

                  const isSelected = blockedTimes.some(
                    (item) => item.hour === hour && item.minute === 0,
                  )

                  const isAlreadyBlocked =
                    selectedBlockedSlots.includes(slotLabel)

                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => {
                        const time = { hour, minute: 0 }

                        setBlockedTimes((prev) => {
                          const exists = prev.some(
                            (item) =>
                              item.hour === hour && item.minute === 0,
                          )

                          return exists
                            ? prev.filter(
                              (item) =>
                                !(
                                  item.hour === hour &&
                                  item.minute === 0
                                ),
                            )
                            : [...prev, time]
                        })
                      }}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${isSelected || isAlreadyBlocked
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      {slotLabel}
                    </button>
                  )
                })}
              </div>

              {selectedBlockedSlots.length > 0 && (
                <p className="text-xs text-red-600">
                  Already blocked: {selectedBlockedSlots.join(", ")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenModal(null)
                setSelectedFieldId(null)
                setBlockedDate("")
                setBlockedTimes([])
              }}
            >
              {t("ownerFields.cancel")}
            </Button>

            <Button
              onClick={handleSaveBlockedSlots}
              disabled={
                isSubmitting ||
                !isValidBlockedDate(blockedDate) ||
                blockedTimes.length === 0
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting
                ? t("ownerFields.saving")
                : t("ownerFields.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}