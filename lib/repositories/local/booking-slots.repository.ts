import type { PlaygroundBookingSlotDefinition } from "@/lib/types/playground-booking"

/**
 * Temporary static time grid (UI only).
 * No availability logic here — availability is derived from bookings.
 * Replace with API call later.
 */
export function repositoryListPlaygroundBookingSlotDefinitions(): PlaygroundBookingSlotDefinition[] {
  const slots: PlaygroundBookingSlotDefinition[] = []

  // مثال: من 10 صباحًا لـ 12 مساءً (عدل حسب مشروعك)
  const startHour = 10
  const endHour = 24

  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = `${String(hour).padStart(2, "0")}:00`
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`

    slots.push({
      id: `slot_${startTime}_${endTime}`,
      startTime,
      endTime,
    })
  }

  return slots
}