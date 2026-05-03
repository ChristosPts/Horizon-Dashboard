import { create } from 'zustand'

const DEFAULT_LAYOUT = [
  { i: 'email',    x: 0,  y: 0, w: 4, h: 4, minW: 3, minH: 3 },
  { i: 'weather',  x: 4,  y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'news',     x: 7,  y: 0, w: 5, h: 4, minW: 3, minH: 3 },
  { i: 'crypto',   x: 4,  y: 2, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'calendar', x: 0,  y: 4, w: 6, h: 5, minW: 4, minH: 4 },
  { i: 'todos',    x: 6,  y: 4, w: 6, h: 5, minW: 3, minH: 3 },
]

export const useLayoutStore = create((set) => ({
  layout: DEFAULT_LAYOUT,

  loadFromStore: async () => {
    const saved = await window.electronAPI?.storeGet('layout')
    if (saved) set({ layout: saved })
  },

  setLayout: (layout) => {
    set({ layout })
    window.electronAPI?.storeSet('layout', layout)
  },

  resetLayout: () => {
    set({ layout: DEFAULT_LAYOUT })
    window.electronAPI?.storeSet('layout', DEFAULT_LAYOUT)
  },
}))
