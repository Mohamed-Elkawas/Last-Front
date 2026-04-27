import type { LocalizedString } from "@/lib/types/common"
import type { Playground } from "@/lib/types/playground"

export type FieldType = "5v5" | "7v7" | "11v11"
export type FieldStatus = "pending_approval" | "active" | "rejected" | "suspended"

export interface FieldLicense {
  fileName: string
  fileSize: number
  uploadedAt: number
  url?: string
}

export interface Field extends Playground {
  fieldType: FieldType
  status: FieldStatus
  license?: FieldLicense
  submittedAt: number
  reviewedAt?: number
  reviewedBy?: string
  rejectionReason?: string
  adminNotes?: string
}

export interface FieldReviewRequest {
  fieldId: string
  fieldType: FieldType
  license: FieldLicense
  submittedAt: number
}

export interface FieldReviewAction {
  fieldId: string
  action: "approve" | "reject"
  reason?: string
  reviewedBy: string
  reviewedAt: number
}
