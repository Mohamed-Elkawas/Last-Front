"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
  TournamentRegistration,
  TournamentRegistrationStatus,
} from "@/lib/types/tournament"

type TournamentRegistrationsStore = {
  registrations: TournamentRegistration[]
  addRegistration: (registration: TournamentRegistration) => void
  removeRegistration: (id: string) => void
  updateRegistrationStatus: (
    id: string,
    status: TournamentRegistrationStatus,
  ) => void
  updateRegistration: (
    id: string,
    data: Partial<TournamentRegistration>,
  ) => void
  getRegistrationById: (id: string) => TournamentRegistration | undefined
  listRegistrations: () => TournamentRegistration[]
  listMyRegistrations: (playerId: string) => TournamentRegistration[]
  listOwnerRegistrations: (ownerId: string) => TournamentRegistration[]
}

export const useTournamentRegistrationsStore =
  create<TournamentRegistrationsStore>()(
    persist(
      (set, get) => ({
        registrations: [],

        addRegistration: (registration) => {
          set((state) => ({
            registrations: [registration, ...state.registrations],
          }))
        },

        removeRegistration: (id) => {
          set((state) => ({
            registrations: state.registrations.filter(
              (registration) => registration.id !== id,
            ),
          }))
        },

        updateRegistrationStatus: (id, status) => {
          set((state) => ({
            registrations: state.registrations.map((registration) =>
              registration.id === id
                ? {
                    ...registration,
                    status,
                    updatedAt: new Date().toISOString(),
                  }
                : registration,
            ),
          }))
        },

        updateRegistration: (id, data) => {
          set((state) => ({
            registrations: state.registrations.map((registration) =>
              registration.id === id
                ? {
                    ...registration,
                    ...data,
                    updatedAt: new Date().toISOString(),
                  }
                : registration,
            ),
          }))
        },

        getRegistrationById: (id) => {
          return get().registrations.find((registration) => registration.id === id)
        },

        listRegistrations: () => {
          return get().registrations
        },

        listMyRegistrations: (playerId) => {
          return get().registrations.filter(
            (registration) => registration.playerId === playerId,
          )
        },

        listOwnerRegistrations: (ownerId) => {
          return get().registrations.filter(
            (registration) => registration.ownerId === ownerId,
          )
        },
      }),
      {
        name: "hagzaya-tournament-registrations",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  )