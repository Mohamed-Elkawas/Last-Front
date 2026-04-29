import type { EgyptGovernorateKey } from "@/lib/types/playground"

export type GovernorateOption = {
  key: EgyptGovernorateKey
  id?: number
  ar: string
  en: string
}
export const EGYPT_GOVERNORATES: GovernorateOption[] = [
  { key: "all", ar: "كل المحافظات", en: "All governorates" },

  { key: "cairo", id: 1, ar: "القاهرة", en: "Cairo" },
  { key: "giza", id: 2, ar: "الجيزة", en: "Giza" },
  { key: "alexandria", id: 3, ar: "الإسكندرية", en: "Alexandria" },
  { key: "dakahlia", id: 4, ar: "الدقهلية", en: "Dakahlia" },
  { key: "red-sea", id: 5, ar: "البحر الأحمر", en: "Red Sea" },
  { key: "beheira", id: 6, ar: "البحيرة", en: "Beheira" },
  { key: "fayoum", id: 7, ar: "الفيوم", en: "Fayoum" },
  { key: "gharbia", id: 8, ar: "الغربية", en: "Gharbia" },
  { key: "ismailia", id: 9, ar: "الإسماعيلية", en: "Ismailia" },
  { key: "monufia", id: 10, ar: "المنوفية", en: "Monufia" },
  { key: "minya", id: 11, ar: "المنيا", en: "Minya" },
  { key: "qalyubia", id: 12, ar: "القليوبية", en: "Qalyubia" },
  { key: "new-valley", id: 13, ar: "الوادي الجديد", en: "New Valley" },
  { key: "suez", id: 14, ar: "السويس", en: "Suez" },
  { key: "aswan", id: 15, ar: "أسوان", en: "Aswan" },
  { key: "assiut", id: 16, ar: "أسيوط", en: "Assiut" },
  { key: "beni-suef", id: 17, ar: "بني سويف", en: "Beni Suef" },
  { key: "port-said", id: 18, ar: "بورسعيد", en: "Port Said" },
  { key: "damietta", id: 19, ar: "دمياط", en: "Damietta" },
  { key: "sharqia", id: 20, ar: "الشرقية", en: "Sharqia" },
  { key: "south-sinai", id: 21, ar: "جنوب سيناء", en: "South Sinai" },
  { key: "kafr-el-sheikh", id: 22, ar: "كفر الشيخ", en: "Kafr El Sheikh" },
  { key: "matrouh", id: 23, ar: "مطروح", en: "Matrouh" },
  { key: "luxor", id: 24, ar: "الأقصر", en: "Luxor" },
  { key: "qena", id: 25, ar: "قنا", en: "Qena" },
  { key: "north-sinai", id: 26, ar: "شمال سيناء", en: "North Sinai" },
  { key: "sohag", id: 27, ar: "سوهاج", en: "Sohag" },
]