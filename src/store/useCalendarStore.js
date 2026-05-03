import { create } from 'zustand'
import {
  format, parseISO,
  addDays, addWeeks, addMonths,
  subDays, subWeeks, subMonths,
} from 'date-fns'

export const useCalendarStore = create((set, get) => ({
  events: [],
  view: 'month',           // 'month' | 'week' | 'day'
  selectedDate: format(new Date(), 'yyyy-MM-dd'),

  loadFromStore: async () => {
    const [events, view, selectedDate] = await Promise.all([
      window.electronAPI?.storeGet('calendar.events'),
      window.electronAPI?.storeGet('calendar.view'),
      window.electronAPI?.storeGet('calendar.selectedDate'),
    ])
    set({
      ...(Array.isArray(events) ? { events } : {}),
      ...(view ? { view } : {}),
      ...(selectedDate ? { selectedDate } : {}),
    })
  },

  addEvent: (data) => {
    const event = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() }
    const events = [...get().events, event]
    set({ events })
    window.electronAPI?.storeSet('calendar.events', events)
  },

  updateEvent: (id, updates) => {
    const events = get().events.map((e) => (e.id === id ? { ...e, ...updates } : e))
    set({ events })
    window.electronAPI?.storeSet('calendar.events', events)
  },

  deleteEvent: (id) => {
    const events = get().events.filter((e) => e.id !== id)
    set({ events })
    window.electronAPI?.storeSet('calendar.events', events)
  },

  setView: (view) => {
    set({ view })
    window.electronAPI?.storeSet('calendar.view', view)
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  setToday: () => set({ selectedDate: format(new Date(), 'yyyy-MM-dd') }),

  navigatePrev: () => {
    const { view, selectedDate } = get()
    const d = parseISO(selectedDate)
    const next =
      view === 'month' ? subMonths(d, 1)
      : view === 'week' ? subWeeks(d, 1)
      : subDays(d, 1)
    set({ selectedDate: format(next, 'yyyy-MM-dd') })
  },

  navigateNext: () => {
    const { view, selectedDate } = get()
    const d = parseISO(selectedDate)
    const next =
      view === 'month' ? addMonths(d, 1)
      : view === 'week' ? addWeeks(d, 1)
      : addDays(d, 1)
    set({ selectedDate: format(next, 'yyyy-MM-dd') })
  },
}))
