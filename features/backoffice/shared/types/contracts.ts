import type {
  AlertRecord,
  AnalyticsMetric,
  AuditLogRecord,
  BookingRecord,
  DisputeRecord,
  FieldRecord,
  OwnerOverviewRecord,
  OwnerRecord,
  PaymentRecord,
  UserRecord,
} from "@/features/backoffice/shared/types/entities"

export type FrontendPlaceholderContract<T> = {
  contractName: string
  source: "mock"
  notes: string
  data: T
}

export type OwnerOverviewContract = FrontendPlaceholderContract<OwnerOverviewRecord>
export type BookingsContract = FrontendPlaceholderContract<BookingRecord[]>
export type PaymentsContract = FrontendPlaceholderContract<PaymentRecord[]>
export type UsersContract = FrontendPlaceholderContract<UserRecord[]>
export type DisputesContract = FrontendPlaceholderContract<DisputeRecord[]>
export type AlertsContract = FrontendPlaceholderContract<AlertRecord[]>

export type PlaceholderFieldsContract = FrontendPlaceholderContract<FieldRecord[]>
export type PlaceholderOwnersContract = FrontendPlaceholderContract<OwnerRecord[]>
export type PlaceholderAuditLogsContract = FrontendPlaceholderContract<AuditLogRecord[]>
export type PlaceholderAnalyticsContract = FrontendPlaceholderContract<AnalyticsMetric[]>
