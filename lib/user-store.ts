"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type User = {
  fullName: string
  username: string
  email: string
  phoneNumber: string
  position: string
  points: number
  avatar?: string

  age?: number
  gender?: string
  address?: string
  joinedAt?: string
}

type UserStore = {
  user: User
  hasHydrated: boolean
  updateUser: (data: Partial<User>) => void
  setUser: (user: User) => void
  resetUser: () => void
  setHasHydrated: (value: boolean) => void
}

const defaultUser: User = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  position: "",
  points: 0,
  avatar: "",

  age: undefined,
  gender: "",
  address: "",
  joinedAt: "",
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: defaultUser,
      hasHydrated: false,

      updateUser: (data) =>
        set((state) => ({
          user: {
            ...state.user,
            ...data,
          },
        })),

      setUser: (user) => set({ user }),

      resetUser: () => set({ user: defaultUser }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "smart-playground-user",
      version: 2,
      storage: createJSONStorage(() => localStorage),

      migrate: (persistedState: any, version) => {
        if (!persistedState) {
          return {
            user: defaultUser,
            hasHydrated: true,
          }
        }

        const oldUser = persistedState.user ?? {}

        if (version < 2) {
          return {
            ...persistedState,
            user: {
              ...defaultUser,
              ...oldUser,
            },
            hasHydrated: true,
          }
        }

        return {
          ...persistedState,
          user: {
            ...defaultUser,
            ...oldUser,
          },
          hasHydrated: true,
        }
      },

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)