import type {
  Booking,
  CreatePlaygroundBookingPayload,
  CreateTournamentBookingPayload,
  PaymentProof,
} from "@/lib/types/booking"

export type ListBookingsResponse = {
  bookings: Booking[]
}

export type CreatePlaygroundBookingResponse = {
  bookingId: string
}

export type CreateTournamentBookingResponse = {
  bookingId: string
}

export type SubmitBookingPaymentBody = {
  proof: PaymentProof
  moveToAwaitingAdmin?: boolean
}

export type CreatePlaygroundBookingBody = CreatePlaygroundBookingPayload
export type CreateTournamentBookingBody = CreateTournamentBookingPayload
