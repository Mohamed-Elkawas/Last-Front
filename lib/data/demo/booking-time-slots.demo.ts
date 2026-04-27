/** Demo slot grid for the booking wizard only (not business rules). */
export const DEMO_BOOKING_SLOT_DEFS = [
  { time: "08:00", available: true },
  { time: "09:00", available: true },
  { time: "10:00", available: false },
  { time: "11:00", available: false },
  { time: "12:00", available: true },
  { time: "13:00", available: true },
  { time: "14:00", available: true },
  { time: "15:00", available: false },
  { time: "16:00", available: true },
  { time: "17:00", available: true },
  { time: "18:00", available: true },
  { time: "19:00", available: false },
  { time: "20:00", available: true },
  { time: "21:00", available: true },
  { time: "22:00", available: true },
] as const
