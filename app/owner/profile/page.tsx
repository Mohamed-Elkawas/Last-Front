"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Headphones,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOwnerProfile } from "@/hooks/use-owner-profile"
import { useAppTranslations } from "@/hooks/use-app-translations"

type Lang = "ar" | "en"

type EditableField =
  | "fullName"
  | "email"
  | "phone"
  | "playgroundName"
  | "location"
  | "venuePhone"
  | "workingHours"
  | "pitchTypes"

const copy = {
  en: {
    ownerControl: "Owner Control",
    title: "Venue Profile",
    saved: "Saved",
    saveChanges: "Save Changes",
    ownerInfo: "Owner Information",
    businessSettings: "Business Settings",
    quickActions: "Quick Actions",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone",
    venueName: "Venue Name",
    location: "Location",
    venuePhone: "Venue Phone",
    workingHours: "Working Hours",
    pitchTypes: "Pitch Types",
    enterFullName: "Enter owner full name",
    enterEmail: "Enter owner email",
    enterPhone: "Enter owner phone",
    enterVenueName: "Enter venue name",
    enterLocation: "Enter venue location",
    enterVenuePhone: "Enter venue phone",
    exampleHours: "Example: 08:00 - 02:00",
    examplePitchTypes: "Example: 5-A-SIDE, 7-A-SIDE",
    payouts: "Payouts",
    support: "Support",
    security: "Security",
    supportCenter: "Support Center",
    supportText: "Connect support tickets or live chat here later.",
    accountSecurity: "Account Security",
    securityText: "Connect password change or security settings here later.",
    edit: "Edit",
    cancel: "Cancel",
  },
  ar: {
    ownerControl: "تحكم المالك",
    title: "ملف الملعب",
    saved: "تم الحفظ",
    saveChanges: "حفظ التغييرات",
    ownerInfo: "بيانات المالك",
    businessSettings: "إعدادات النشاط",
    quickActions: "إجراءات سريعة",
    fullName: "الاسم بالكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    venueName: "اسم الملعب",
    location: "الموقع",
    venuePhone: "هاتف الملعب",
    workingHours: "مواعيد العمل",
    pitchTypes: "أنواع الملاعب",
    enterFullName: "اكتب اسم المالك بالكامل",
    enterEmail: "اكتب البريد الإلكتروني",
    enterPhone: "اكتب رقم الهاتف",
    enterVenueName: "اكتب اسم الملعب",
    enterLocation: "اكتب موقع الملعب",
    enterVenuePhone: "اكتب هاتف الملعب",
    exampleHours: "مثال: 08:00 - 02:00",
    examplePitchTypes: "مثال: 5-A-SIDE, 7-A-SIDE",
    payouts: "المدفوعات",
    support: "الدعم",
    security: "الأمان",
    supportCenter: "مركز الدعم",
    supportText: "اربط هنا لاحقًا تذاكر الدعم أو الشات من الباك.",
    accountSecurity: "أمان الحساب",
    securityText: "اربط هنا لاحقًا تغيير كلمة المرور أو إعدادات الأمان.",
    edit: "تعديل",
    cancel: "إلغاء",
  },
} as const

function asText(value: unknown): string {
  if (typeof value === "string") return value

  if (value && typeof value === "object" && ("ar" in value || "en" in value)) {
    const localized = value as { ar?: string; en?: string }
    return localized.ar || localized.en || ""
  }

  return ""
}

function toLocalized(value: string) {
  return { ar: value, en: value }
}

function InfoInput({
  icon,
  label,
  value,
  placeholder,
  isEditing,
  onEdit,
  onCancel,
  onChange,
  dir,
  editText,
  cancelText,
}: {
  icon: React.ReactNode
  label: string
  value: string
  placeholder: string
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onChange: (value: string) => void
  dir: "rtl" | "ltr"
  editText: string
  cancelText: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-emerald-50/70 p-4">
      <button
        type="button"
        onClick={isEditing ? onCancel : onEdit}
        title={isEditing ? cancelText : editText}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-700 transition hover:bg-emerald-100"
      >
        {isEditing ? <X className="h-5 w-5" /> : icon}
      </button>

      <div className="min-w-0 flex-1">
        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>

        <Input
          dir={dir}
          value={value}
          readOnly={!isEditing}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`mt-1 h-auto border-0 bg-transparent p-0 text-base font-bold shadow-none focus-visible:ring-0 ${
            isEditing
              ? "cursor-text text-foreground"
              : "cursor-default text-foreground"
          }`}
        />
      </div>

      {!isEditing && (
        <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-3 rounded-2xl p-4 transition hover:bg-muted active:scale-[0.98]"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        {icon}
      </span>

      <span className="text-sm font-bold text-foreground">{label}</span>
    </button>
  )
}

export default function OwnerProfilePage() {
  const router = useRouter()
  const { language } = useAppTranslations()
  const { personal, venue, hasHydrated, setPersonal, setVenue } =
    useOwnerProfile()

  const lang: Lang = language === "ar" ? "ar" : "en"
  const text = copy[lang]
  const dir = lang === "ar" ? "rtl" : "ltr"

  const [saved, setSaved] = useState(false)
  const [activePanel, setActivePanel] = useState<"support" | "security" | null>(
    null,
  )
  const [editingField, setEditingField] = useState<EditableField | null>(null)

  const [draft, setDraft] = useState({
    fullName: "",
    email: "",
    phone: "",
    playgroundName: "",
    location: "",
    venuePhone: "",
    workingHours: "",
    pitchTypes: "",
  })

  const currentValues = useMemo(
    () => ({
      fullName: personal.fullName || "",
      email: personal.email || "",
      phone: personal.phone || "",
      playgroundName: asText(venue.playgroundName),
      location: asText(venue.location),
      venuePhone: asText(venue.venuePhone),
      workingHours: asText(venue.workingHours),
      pitchTypes: asText(venue.pitchTypes),
    }),
    [personal, venue],
  )

  if (!hasHydrated) return null

  function startEdit(field: EditableField) {
    setDraft(currentValues)
    setEditingField(field)
  }

  function cancelEdit() {
    setDraft(currentValues)
    setEditingField(null)
  }

  function markSaved() {
    setPersonal({
      fullName: draft.fullName,
      email: draft.email,
      phone: draft.phone,
    })

    setVenue({
      playgroundName: toLocalized(draft.playgroundName),
      location: toLocalized(draft.location),
      venuePhone: draft.venuePhone,
      workingHours: draft.workingHours,
      pitchTypes: draft.pitchTypes,
    })

    setEditingField(null)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1200)
  }

  function getValue(field: EditableField) {
    return editingField === field ? draft[field] : currentValues[field]
  }

  function setDraftValue(field: EditableField, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const pitchTypeList = getValue("pitchTypes")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div dir={dir} className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            {text.ownerControl}
          </p>
          <h1 className="text-3xl font-black tracking-tight">{text.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {text.saved}
            </div>
          )}

          <Button
            type="button"
            onClick={markSaved}
            disabled={!editingField}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {text.saveChanges}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">{text.ownerInfo}</h2>
            <UserRound className="h-6 w-6 text-emerald-600" />
          </div>

          <div className="space-y-4">
            <InfoInput
              icon={<UserRound className="h-5 w-5" />}
              label={text.fullName}
              value={getValue("fullName")}
              placeholder={text.enterFullName}
              isEditing={editingField === "fullName"}
              onEdit={() => startEdit("fullName")}
              onCancel={cancelEdit}
              onChange={(value) => setDraftValue("fullName", value)}
              dir={dir}
              editText={text.edit}
              cancelText={text.cancel}
            />

            <InfoInput
              icon={<Mail className="h-5 w-5" />}
              label={text.email}
              value={getValue("email")}
              placeholder={text.enterEmail}
              isEditing={editingField === "email"}
              onEdit={() => startEdit("email")}
              onCancel={cancelEdit}
              onChange={(value) => setDraftValue("email", value)}
              dir="ltr"
              editText={text.edit}
              cancelText={text.cancel}
            />

            <InfoInput
              icon={<Phone className="h-5 w-5" />}
              label={text.phone}
              value={getValue("phone")}
              placeholder={text.enterPhone}
              isEditing={editingField === "phone"}
              onEdit={() => startEdit("phone")}
              onCancel={cancelEdit}
              onChange={(value) => setDraftValue("phone", value)}
              dir="ltr"
              editText={text.edit}
              cancelText={text.cancel}
            />
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">{text.businessSettings}</h2>
            <Settings className="h-7 w-7 text-emerald-600" />
          </div>

          <div className="space-y-5">
            <InfoInput
              icon={<Building2 className="h-5 w-5" />}
              label={text.venueName}
              value={getValue("playgroundName")}
              placeholder={text.enterVenueName}
              isEditing={editingField === "playgroundName"}
              onEdit={() => startEdit("playgroundName")}
              onCancel={cancelEdit}
              onChange={(value) => setDraftValue("playgroundName", value)}
              dir={dir}
              editText={text.edit}
              cancelText={text.cancel}
            />

            <InfoInput
              icon={<MapPin className="h-5 w-5" />}
              label={text.location}
              value={getValue("location")}
              placeholder={text.enterLocation}
              isEditing={editingField === "location"}
              onEdit={() => startEdit("location")}
              onCancel={cancelEdit}
              onChange={(value) => setDraftValue("location", value)}
              dir={dir}
              editText={text.edit}
              cancelText={text.cancel}
            />

            <InfoInput
              icon={<Phone className="h-5 w-5" />}
              label={text.venuePhone}
              value={getValue("venuePhone")}
              placeholder={text.enterVenuePhone}
              isEditing={editingField === "venuePhone"}
              onEdit={() => startEdit("venuePhone")}
              onCancel={cancelEdit}
              onChange={(value) => setDraftValue("venuePhone", value)}
              dir="ltr"
              editText={text.edit}
              cancelText={text.cancel}
            />

            <InfoInput
              icon={<Clock3 className="h-5 w-5" />}
              label={text.workingHours}
              value={getValue("workingHours")}
              placeholder={text.exampleHours}
              isEditing={editingField === "workingHours"}
              onEdit={() => startEdit("workingHours")}
              onCancel={cancelEdit}
              onChange={(value) => setDraftValue("workingHours", value)}
              dir="ltr"
              editText={text.edit}
              cancelText={text.cancel}
            />

            <InfoInput
              icon={<Building2 className="h-5 w-5" />}
              label={text.pitchTypes}
              value={getValue("pitchTypes")}
              placeholder={text.examplePitchTypes}
              isEditing={editingField === "pitchTypes"}
              onEdit={() => startEdit("pitchTypes")}
              onCancel={cancelEdit}
              onChange={(value) => setDraftValue("pitchTypes", value)}
              dir="ltr"
              editText={text.edit}
              cancelText={text.cancel}
            />

            {pitchTypeList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pitchTypeList.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-black text-slate-700"
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-2xl font-black">{text.quickActions}</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={<CreditCard className="h-6 w-6" />}
            label={text.payouts}
            onClick={() => router.push("/owner/operations")}
          />

          <QuickAction
            icon={<Headphones className="h-6 w-6" />}
            label={text.support}
            onClick={() => setActivePanel("support")}
          />

          <QuickAction
            icon={<ShieldCheck className="h-6 w-6" />}
            label={text.security}
            onClick={() => setActivePanel("security")}
          />
        </div>
      </section>

      {activePanel && (
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">
              {activePanel === "support" ? text.support : text.security}
            </h2>

            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition hover:bg-muted/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {activePanel === "support" ? (
            <div className="rounded-2xl bg-emerald-50/70 p-4">
              <p className="font-bold">{text.supportCenter}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {text.supportText}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50/70 p-4">
              <div className="flex items-center gap-3">
                <LockKeyhole className="h-5 w-5 text-emerald-600" />
                <p className="font-bold">{text.accountSecurity}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {text.securityText}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}