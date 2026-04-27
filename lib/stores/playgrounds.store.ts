import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Playground } from "@/lib/types/playground"

export interface PlaygroundWithPricing extends Playground {
  morningPrice?: number
  eveningPrice?: number
  blockedSlots?: Record<string, string[]>
}

interface PlaygroundsStore {
  userPlaygrounds: Playground[]
  deletedPlaygroundIds: string[]
  fieldPricing: Record<string, { morning: number; evening: number }>
  blockedSlots: Record<string, string[]>

  addUserPlayground: (playground: Playground) => void
  updateUserPlayground: (id: string, updates: Partial<Playground>) => void
  removeUserPlayground: (id: string) => void

  markPlaygroundDeleted: (id: string) => void

  setFieldPricing: (fieldId: string, pricing: { morning: number; evening: number }) => void
  setBlockedSlots: (fieldId: string, date: string, slots: string[]) => void
  clearBlockedSlots: (fieldId: string, date?: string) => void
}

export const usePlaygroundsStore = create<PlaygroundsStore>()(
  persist(
    (set) => ({
      userPlaygrounds: [],
      deletedPlaygroundIds: [],
      fieldPricing: {},
      blockedSlots: {},

      addUserPlayground: (playground) =>
        set((state) => ({
          userPlaygrounds: [...state.userPlaygrounds, playground],
          deletedPlaygroundIds: state.deletedPlaygroundIds.filter(
            (id) => id !== playground.id
          ),
        })),

      updateUserPlayground: (id, updates) =>
        set((state) => ({
          userPlaygrounds: state.userPlaygrounds.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removeUserPlayground: (id) =>
        set((state) => {
          const nextPricing = { ...state.fieldPricing }
          delete nextPricing[id]

          const nextBlockedSlots = { ...state.blockedSlots }
          Object.keys(nextBlockedSlots).forEach((key) => {
            if (key.startsWith(`${id}_`)) {
              delete nextBlockedSlots[key]
            }
          })

          return {
            userPlaygrounds: state.userPlaygrounds.filter((p) => p.id !== id),
            fieldPricing: nextPricing,
            blockedSlots: nextBlockedSlots,
          }
        }),

      markPlaygroundDeleted: (id) =>
        set((state) => ({
          deletedPlaygroundIds: state.deletedPlaygroundIds.includes(id)
            ? state.deletedPlaygroundIds
            : [...state.deletedPlaygroundIds, id],
        })),

      setFieldPricing: (fieldId, pricing) =>
        set((state) => ({
          fieldPricing: {
            ...state.fieldPricing,
            [fieldId]: pricing,
          },
        })),

      setBlockedSlots: (fieldId, date, slots) =>
        set((state) => {
          const key = `${fieldId}_${date}`

          return {
            blockedSlots: {
              ...state.blockedSlots,
              [key]: slots,
            },
          }
        }),

      clearBlockedSlots: (fieldId, date) =>
        set((state) => {
          const nextBlockedSlots = { ...state.blockedSlots }

          if (date) {
            delete nextBlockedSlots[`${fieldId}_${date}`]
          } else {
            Object.keys(nextBlockedSlots).forEach((key) => {
              if (key.startsWith(`${fieldId}_`)) {
                delete nextBlockedSlots[key]
              }
            })
          }

          return { blockedSlots: nextBlockedSlots }
        }),
    }),
    {
      name: "playgrounds-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userPlaygrounds: state.userPlaygrounds,
        deletedPlaygroundIds: state.deletedPlaygroundIds,
        fieldPricing: state.fieldPricing,
        blockedSlots: state.blockedSlots,
      }),
    }
  )
)