"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type TournamentDrawFormat = "league" | "knockout" | "groups_knockout"

export type TournamentDrawTeam = {
  id: string
  name: string
  playersCount: number
}

export type TournamentDrawMatch = {
  id: string
  tournamentId: string
  homeTeam: TournamentDrawTeam | null
  awayTeam: TournamentDrawTeam | null
  round: number
  groupName?: string
  status: "scheduled" | "completed" | "locked"
  homeScore: number | null
  awayScore: number | null
  createdAt: string
}

export type TournamentDraw = {
  tournamentId: string
  format: TournamentDrawFormat
  teams: TournamentDrawTeam[]
  matches: TournamentDrawMatch[]
  createdAt: string
}

type TournamentDrawStore = {
  draws: TournamentDraw[]

  getDrawByTournamentId: (tournamentId: string) => TournamentDraw | null
  saveDraw: (draw: TournamentDraw) => void
  deleteDraw: (tournamentId: string) => void
}

export const useTournamentDrawStore = create<TournamentDrawStore>()(
  persist(
    (set, get) => ({
      draws: [],

      getDrawByTournamentId: (tournamentId) => {
        return get().draws.find((draw) => draw.tournamentId === tournamentId) ?? null
      },

      saveDraw: (draw) => {
        set((state) => ({
          draws: [
            ...state.draws.filter((item) => item.tournamentId !== draw.tournamentId),
            draw,
          ],
        }))
      },

      deleteDraw: (tournamentId) => {
        set((state) => ({
          draws: state.draws.filter((draw) => draw.tournamentId !== tournamentId),
        }))
      },
    }),
    {
      name: "hagzaya-tournament-draws",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)