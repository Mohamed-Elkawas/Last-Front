import { DEMO_BOOKING_SLOT_DEFS } from "@/lib/data/demo/booking-time-slots.demo"
import type { PlaygroundBookingSlotDefinition } from "@/lib/types/playground-booking"

export function repositoryListPlaygroundBookingSlotDefinitions(): PlaygroundBookingSlotDefinition[] {
  return DEMO_BOOKING_SLOT_DEFS.map((s) => ({ time: s.time, available: s.available }))
}
