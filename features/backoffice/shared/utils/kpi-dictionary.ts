export const backofficeKpiDictionary = {
  utilizationRate: {
    label: "Utilization Rate",
    formula: "booked hours / available hours * 100",
  },
  bookingConfirmationRate: {
    label: "Booking Confirmation Rate",
    formula: "confirmed bookings / total booking attempts * 100",
  },
  refundRate: {
    label: "Refund Rate",
    formula: "refunded bookings / confirmed bookings * 100",
  },
  cancellationRate: {
    label: "Cancellation Rate",
    formula: "canceled bookings / total bookings * 100",
  },
  noShowRate: {
    label: "No-show Rate",
    formula: "no-show bookings / confirmed bookings * 100",
  },
  paymentApprovalRate: {
    label: "Payment Approval Rate",
    formula: "approved payments / submitted payments * 100",
  },
  averageBookingValue: {
    label: "Average Booking Value",
    formula: "total booking revenue / confirmed bookings",
  },
  platformCommissionRevenue: {
    label: "Platform Commission Revenue",
    formula: "confirmed revenue * 0.08",
  },
} as const
