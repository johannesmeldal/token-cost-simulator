import { create } from 'zustand'
import type { SimulationSpeed, SimulationEvent, HistoricalDataPoint } from '../types/simulation'

const MAX_EVENTS = 100
// 10 ticks (HISTORY_INTERVAL) = 10 simulerte timer per punkt, så 2000 punkter
// dekker over 2 simulerte år med historikk til dag/uke/måned/år-grafen.
const MAX_HISTORY = 2000

interface SimulationState {
  isRunning: boolean
  speed: SimulationSpeed
  tick: number
  events: SimulationEvent[]
  history: HistoricalDataPoint[]

  start: () => void
  pause: () => void
  setSpeed: (speed: SimulationSpeed) => void
  reset: () => void
  pushEvent: (event: SimulationEvent) => void
  pushHistory: (point: HistoricalDataPoint) => void
  incrementTick: () => void
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isRunning: false,
  speed: 1,
  tick: 0,
  events: [],
  history: [],

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  setSpeed: (speed) => set({ speed }),
  reset: () => set({ isRunning: false, tick: 0, events: [], history: [] }),

  pushEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, MAX_EVENTS),
    })),

  pushHistory: (point) =>
    set((state) => ({
      history: [...state.history, point].slice(-MAX_HISTORY),
    })),

  incrementTick: () => set((state) => ({ tick: state.tick + 1 })),
}))
