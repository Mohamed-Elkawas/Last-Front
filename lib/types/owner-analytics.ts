export interface OwnerKPIs {
  todayBookingsCount: number
  totalBookingsCount: number
  noShowRate: number
  utilizationRate: number
  todayBookingsTrend: number
  utilizationTrend: number
}

export interface BookingAnalytics {
  id: string
  status: string
  paymentStatus: string
  date: string
  hours: number
  createdAt: number
  playedAt?: number
  cancelledAt?: number
}

export interface FieldUtilization {
  fieldId: string
  fieldName: string
  totalHours: number
  bookedHours: number
  utilizationRate: number
}
