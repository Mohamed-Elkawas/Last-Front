"use client"

import { useMemo, useState } from "react"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppTranslations } from "@/hooks/use-app-translations"
import type { FieldMutationPayload, FieldRecord } from "@/lib/services/fields.api"

type FieldFormProps = {
  initialValue?: FieldRecord | null
  submitLabel: string
  title: string
  description: string
  loading?: boolean
  errorMessage?: string | null
  onSubmit: (payload: FieldMutationPayload) => Promise<void> | void
}

type FieldFormState = {
  name: string
  city: string
  village: string
  address: string
  governorate: string
  type: string
  priceAm: string
  pricePm: string
  photos: string
  amenities: string
  capacity: string
  surface: string
  openingTime: string
  closingTime: string
  latitude: string
  longitude: string
}

const FIELD_TYPES = ["5v5", "7v7", "11v11"]

const fieldFormText = {
  ar: {
    status: "تنبيه",
    name: "اسم الملعب",
    city: "المدينة",
    village: "المنطقة",
    governorate: "المحافظة",
    address: "العنوان",
    type: "نوع الملعب",
    typePlaceholder: "اختر نوع الملعب",
    surface: "نوع الأرضية",
    morningPrice: "سعر الصباح",
    eveningPrice: "سعر المساء",
    capacity: "السعة",
    openingTime: "وقت الفتح",
    closingTime: "وقت الإغلاق",
    latitude: "خط العرض",
    longitude: "خط الطول",
    images: "صور الملعب",
    imagesPlaceholder: "ضع روابط الصور، كل رابط في سطر منفصل",
    amenities: "المميزات",
    amenitiesPlaceholder: "افصل بين المميزات بفاصلة أو بسطر جديد",
    invalidPrices: "من فضلك أدخل أسعارًا صحيحة.",
    eveningPriceError: "سعر المساء يجب أن يكون أكبر من أو يساوي سعر الصباح.",
    loading: "جاري التحميل...",
  },
  en: {
    status: "Status",
    name: "Name",
    city: "City",
    village: "Village",
    governorate: "Governorate",
    address: "Address",
    type: "Type",
    typePlaceholder: "Select field type",
    surface: "Surface",
    morningPrice: "Morning Price",
    eveningPrice: "Evening Price",
    capacity: "Capacity",
    openingTime: "Opening Time",
    closingTime: "Closing Time",
    latitude: "Latitude",
    longitude: "Longitude",
    images: "Images",
    imagesPlaceholder: "Add image URLs, one URL per line",
    amenities: "Amenities",
    amenitiesPlaceholder: "Comma or line separated",
    invalidPrices: "Please enter valid prices.",
    eveningPriceError: "Evening price must be greater than or equal to morning price.",
    loading: "Loading...",
  },
} as const

function splitTextList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toInitialState(field?: FieldRecord | null): FieldFormState {
  return {
    name: field?.name.en || field?.name.ar || "",
    city: field?.city ?? field?.cityKey ?? "",
    village: field?.village ?? "",
    address: field?.address ?? "",
    governorate: field?.governorate ?? "",
    type: field?.type || field?.pitchSizes[0] || "5v5",
    priceAm:
      field?.priceAm !== undefined && field?.priceAm !== null
        ? String(field.priceAm)
        : String(field?.price.min ?? ""),
    pricePm:
      field?.pricePm !== undefined && field?.pricePm !== null
        ? String(field.pricePm)
        : String(field?.price.max ?? ""),
    photos: field?.photos.join("\n") ?? "",
    amenities: field?.amenities.join(", ") ?? "",
    capacity:
      field?.capacity !== null && field?.capacity !== undefined
        ? String(field.capacity)
        : "",
    surface: field?.surface ?? "",
    openingTime: field?.openingTime ?? "",
    closingTime: field?.closingTime ?? "",
    latitude:
      field?.latitude !== null && field?.latitude !== undefined
        ? String(field.latitude)
        : "",
    longitude:
      field?.longitude !== null && field?.longitude !== undefined
        ? String(field.longitude)
        : "",
  }
}

export function FieldForm({
  initialValue,
  submitLabel,
  title,
  description,
  loading = false,
  errorMessage,
  onSubmit,
}: FieldFormProps) {
  const { language, isArabic } = useAppTranslations()

  const text = useMemo(() => {
    return fieldFormText[isArabic || language === "ar" ? "ar" : "en"]
  }, [isArabic, language])

  const [form, setForm] = useState<FieldFormState>(() => toInitialState(initialValue))
  const [localError, setLocalError] = useState<string | null>(null)

  const currentError = errorMessage || localError

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.address.trim().length > 0 &&
      form.type.trim().length > 0 &&
      form.priceAm.trim().length > 0 &&
      form.pricePm.trim().length > 0
    )
  }, [form.address, form.city, form.name, form.priceAm, form.pricePm, form.type])

  const updateField = (key: keyof FieldFormState, value: string) => {
    setLocalError(null)
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const priceAm = Number(form.priceAm)
    const pricePm = Number(form.pricePm)

    if (!Number.isFinite(priceAm) || !Number.isFinite(pricePm) || priceAm < 0 || pricePm < 0) {
      setLocalError(text.invalidPrices)
      return
    }

    if (pricePm < priceAm) {
      setLocalError(text.eveningPriceError)
      return
    }

    const payload: FieldMutationPayload = {
      name: form.name.trim(),
      city: form.city.trim(),
      village: form.village.trim(),
      address: form.address.trim(),
      governorate: form.governorate.trim(),
      type: form.type,
      priceAm,
      pricePm,
      photos: form.photos.trim(),
      amenities: splitTextList(form.amenities),
      capacity: form.capacity.trim() ? Number(form.capacity) : null,
      surface: form.surface.trim(),
      openingTime: form.openingTime.trim(),
      closingTime: form.closingTime.trim(),
      latitude: form.latitude.trim() ? Number(form.latitude) : null,
      longitude: form.longitude.trim() ? Number(form.longitude) : null,
    }

    await onSubmit(payload)
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {currentError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{text.status}</AlertTitle>
              <AlertDescription>{currentError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="field-name">{text.name}</Label>
              <Input id="field-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-city">{text.city}</Label>
              <Input id="field-city" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-village">{text.village}</Label>
              <Input id="field-village" value={form.village} onChange={(e) => updateField("village", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-governorate">{text.governorate}</Label>
              <Input id="field-governorate" value={form.governorate} onChange={(e) => updateField("governorate", e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="field-address">{text.address}</Label>
              <Input id="field-address" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{text.type}</Label>
              <Select value={form.type} onValueChange={(value) => updateField("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={text.typePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-surface">{text.surface}</Label>
              <Input id="field-surface" value={form.surface} onChange={(e) => updateField("surface", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-price-am">{text.morningPrice}</Label>
              <Input id="field-price-am" type="number" min="0" value={form.priceAm} onChange={(e) => updateField("priceAm", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-price-pm">{text.eveningPrice}</Label>
              <Input id="field-price-pm" type="number" min="0" value={form.pricePm} onChange={(e) => updateField("pricePm", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-capacity">{text.capacity}</Label>
              <Input id="field-capacity" type="number" min="0" value={form.capacity} onChange={(e) => updateField("capacity", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-opening-time">{text.openingTime}</Label>
              <Input id="field-opening-time" value={form.openingTime} onChange={(e) => updateField("openingTime", e.target.value)} placeholder="08:00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-closing-time">{text.closingTime}</Label>
              <Input id="field-closing-time" value={form.closingTime} onChange={(e) => updateField("closingTime", e.target.value)} placeholder="23:00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-latitude">{text.latitude}</Label>
              <Input id="field-latitude" value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-longitude">{text.longitude}</Label>
              <Input id="field-longitude" value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="field-photos">{text.images}</Label>
              <Input
                id="field-photos"
                value={form.photos}
                onChange={(e) => updateField("photos", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="field-amenities">{text.amenities}</Label>
              <Textarea
                id="field-amenities"
                value={form.amenities}
                onChange={(e) => updateField("amenities", e.target.value)}
                placeholder={text.amenitiesPlaceholder}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? text.loading : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}