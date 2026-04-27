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
  Trash2,
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

function PageHeader({ title, description }: { title: string; description: string }) {
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

  const { playgrounds, loading: playgroundsLoading, reload } = usePlaygroundsCatalog()
  const { ownedPlaygroundIds, hasHydrated: ownerHydrated } = useOwnerAccess()
  const { data: bookingsData = [] } = useOwnerBookings()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [blockedDate, setBlockedDate] = useState("")
  const [blockedTimes, setBlockedTimes] = useState<Time[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const { userPlaygrounds, fieldPricing, setFieldPricing, setBlockedSlots } =
    usePlaygroundsStore()

  const safePlaygrounds = Array.isArray(playgrounds) ? playgrounds : []
  const safeBookings = Array.isArray(bookingsData) ? bookingsData : []
  const safeOwnedPlaygroundIds = Array.isArray(ownedPlaygroundIds)
    ? ownedPlaygroundIds
    : []

  const ownedPlaygrounds = useMemo(() => {
    if (safePlaygrounds.length === 0 || safeOwnedPlaygroundIds.length === 0) return []

    const idSet = new Set(safeOwnedPlaygroundIds)

    return safePlaygrounds.filter((p) => idSet.has(p.id))
  }, [safePlaygrounds, safeOwnedPlaygroundIds])

  const fieldsWithOccupancy = useMemo(() => {
    return ownedPlaygrounds.map((field) => {
      const fieldBookings = safeBookings.filter(
        (b) =>
          (b as any).fieldId === field.id ||
          (b as any).playground?.id === field.id ||
          (b as any).playgroundId === field.id
      )

      const confirmedBookings = fieldBookings.filter(
        (b) =>
          (b as any).status === "confirmed" ||
          (b as any).status === "completed" ||
          (b as any).bookingStatus === "confirmed" ||
          (b as any).bookingStatus === "completed"
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

  const featuredField = fieldsWithOccupancy.length > 0 ? fieldsWithOccupancy[0] : null
  const selectedField = fieldsWithOccupancy.find((f) => f.id === selectedFieldId)
  const isLoading = playgroundsLoading || !ownerHydrated

  const handleNewField = () => setOpenModal("create")

  const handleEditPricing = (fieldId: string) => {
    setSelectedFieldId(fieldId)
    setOpenModal("pricing")
  }

  const handleBlockSlots = (fieldId: string) => {
    setSelectedFieldId(fieldId)
    setOpenModal("blocking")
  }

  const handleCreateTournament = (fieldId: string) => {
    router.push(`/owner/tournaments?fieldId=${fieldId}`)
  }

  const handleDeleteField = async (fieldId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this field permanently?"
    )

    if (!confirmed) return

    setIsSubmitting(true)

    try {
      await deletePlayground(fieldId)

      const ownerStore = useOwnerAccessStore.getState()
      const currentIds = ownerStore.ownedPlaygroundIds ?? []

      ownerStore.setOwnerApproved(currentIds.filter((id) => id !== fieldId))

      await reload()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSavePricing = async () => {
    if (!selectedFieldId) return

    setIsSubmitting(true)

    try {
      const morning = Number(
        (document.getElementById("morningPrice") as HTMLInputElement)?.value ?? 0
      )

      const evening = Number(
        (document.getElementById("eveningPrice") as HTMLInputElement)?.value ?? 0
      )

      if (morning > 0 && evening > 0) {
        setFieldPricing(selectedFieldId, { morning, evening })

        const playground = userPlaygrounds.find((p) => p.id === selectedFieldId)

        if (playground) {
          await updatePlayground(selectedFieldId, {
            price: { min: morning, max: evening },
          })
        }

        await reload()

        setOpenModal(null)
        setSelectedFieldId(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveBlockedSlots = async () => {
    if (!selectedFieldId || !blockedDate) return

    setIsSubmitting(true)

    try {
      const times = blockedTimes.map(
        (time) =>
          `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`
      )

      setBlockedSlots(selectedFieldId, blockedDate, times)

      setOpenModal(null)
      setSelectedFieldId(null)
      setBlockedDate("")
      setBlockedTimes([])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateField = async () => {
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
        Array.from(new Set([...currentIds, createdPlayground.id]))
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
      <div className="flex items-center justify-between">
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

      {featuredField ? (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
            <div className="relative min-h-80 overflow-hidden">
              {featuredField.imageUrl ? (
                <img
                  src={featuredField.imageUrl}
                  alt={featuredField.name.en || featuredField.name.ar || "Field"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    target.parentElement?.classList.add(
                      "bg-gradient-to-br",
                      "from-green-400",
                      "to-green-600"
                    )
                  }}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-green-400 to-green-600" />
              )}

              <div className="absolute inset-0 flex items-center justify-center">
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
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {t("ownerFields.createTournament")}
                </Button>

                <Button
                  onClick={() => handleDeleteField(featuredField.id)}
                  variant="destructive"
                  className="gap-2"
                  disabled={isSubmitting}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
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
              {fieldsWithOccupancy.length === 0 ? (
                <EmptyState
                  icon={AlertCircle}
                  title={t("ownerFields.noFields")}
                  description={t("ownerFields.addFirstField")}
                />
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {fieldsWithOccupancy.map((field) => (
                    <Card key={field.id} className="overflow-hidden">
                      <div className="relative h-24">
                        {field.imageUrl ? (
                          <img
                            src={field.imageUrl}
                            alt={field.name.en || field.name.ar || "Field"}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              target.parentElement?.classList.add(
                                "bg-gradient-to-br",
                                "from-green-300",
                                "to-green-500"
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

                        <div className="grid grid-cols-2 gap-2 pt-2">
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
                            onClick={() =>
                              router.push(`/owner/operations?fieldId=${field.id}`)
                            }
                          >
                            {t("ownerFields.viewSchedule")}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="col-span-2 gap-2 text-xs"
                            disabled={isSubmitting}
                            onClick={() => handleDeleteField(field.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete Field
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Card
                    onClick={handleNewField}
                    className="flex cursor-pointer items-center justify-center border-2 border-dashed bg-green-50 transition-colors hover:bg-green-100"
                  >
                    <CardContent className="flex flex-col items-center justify-center space-y-3 p-4 text-center">
                      <Plus className="h-8 w-8 text-green-600" />
                      <div>
                        <h4 className="font-semibold">
                          {t("ownerFields.registerNewZone")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t("ownerFields.addNewFieldOrZone")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-3">
                  {fieldsWithOccupancy.map((field) => (
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

                        <div className="flex gap-2">
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
                            onClick={() =>
                              router.push(`/owner/operations?fieldId=${field.id}`)
                            }
                          >
                            {t("ownerFields.viewSchedule")}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                            disabled={isSubmitting}
                            onClick={() => handleDeleteField(field.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
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
                          fieldName: featuredField.name.en || featuredField.name.ar,
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
                          fieldName: featuredField.name.en || featuredField.name.ar,
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

                  {featuredField.occupancy >= 50 && featuredField.occupancy < 80 && (
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
        open={openModal === "create"}
        onOpenChange={(open) => {
          if (!open) setOpenModal(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("ownerFields.newField")}</DialogTitle>
            <DialogDescription>
              {t("ownerFields.addNewFieldOrZone")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Field Name</Label>
              <Input
                id="name"
                value={newFieldForm.name}
                onChange={(e) =>
                  setNewFieldForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Heliopolis 5v5 Arena"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newFieldForm.location}
                onChange={(e) =>
                  setNewFieldForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="e.g., Heliopolis, Cairo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type</Label>
              <select
                id="fieldType"
                value={newFieldForm.fieldType}
                onChange={(e) =>
                  setNewFieldForm((prev) => ({
                    ...prev,
                    fieldType: e.target.value as "5v5" | "7v7" | "11v11",
                  }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="5v5">5v5</option>
                <option value="7v7">7v7</option>
                <option value="11v11">11v11</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Minimum Price (EGP/hr)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={newFieldForm.minPrice}
                  onChange={(e) =>
                    setNewFieldForm((prev) => ({
                      ...prev,
                      minPrice: e.target.value,
                    }))
                  }
                  placeholder="e.g., 200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">Maximum Price (EGP/hr)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={newFieldForm.maxPrice}
                  onChange={(e) =>
                    setNewFieldForm((prev) => ({
                      ...prev,
                      maxPrice: e.target.value,
                    }))
                  }
                  placeholder="e.g., 400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={newFieldForm.imageUrl}
                onChange={(e) =>
                  setNewFieldForm((prev) => ({
                    ...prev,
                    imageUrl: e.target.value,
                  }))
                }
                placeholder="/images/playground-1.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Enter the image URL for your field. Use a placeholder if not available.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>
              {t("ownerFields.cancel")}
            </Button>
            <Button
              onClick={handleCreateField}
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
                type="date"
                value={blockedDate}
                onChange={(e) => setBlockedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("ownerFields.selectSlots")}</Label>
              <p className="text-xs text-muted-foreground">
                Select time slots to block on {blockedDate || "selected date"}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <button
                    key={hour}
                    onClick={() => {
                      const time = { hour, minute: 0 }

                      setBlockedTimes((prev) => {
                        const exists = prev.some(
                          (t) => t.hour === hour && t.minute === 0
                        )

                        return exists
                          ? prev.filter(
                              (t) => !(t.hour === hour && t.minute === 0)
                            )
                          : [...prev, time]
                      })
                    }}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      blockedTimes.some(
                        (t) => t.hour === hour && t.minute === 0
                      )
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {`${String(hour).padStart(2, "0")}:00`}
                  </button>
                ))}
              </div>
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
              disabled={isSubmitting || !blockedDate || blockedTimes.length === 0}
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