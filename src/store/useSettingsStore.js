import { create } from 'zustand'

const DEFAULTS = {
  theme: 'dark',
  widgetVisibility: {
    email: true, weather: true, news: true,
    crypto: true, calendar: true, todos: true,
  },
  acrylicEnabled: true,
}

export const useSettingsStore = create((set, get) => ({
  ...DEFAULTS,
  appView: 'dashboard',  // 'dashboard' | 'settings'

  loadFromStore: async () => {
    const [theme, widgetVisibility, acrylicEnabled] = await Promise.all([
      window.electronAPI?.storeGet('settings.theme'),
      window.electronAPI?.storeGet('settings.widgetVisibility'),
      window.electronAPI?.storeGet('settings.acrylicEnabled'),
    ])
    set({
      ...(theme ? { theme } : {}),
      ...(widgetVisibility ? { widgetVisibility } : {}),
      ...(acrylicEnabled !== null && acrylicEnabled !== undefined ? { acrylicEnabled } : {}),
    })
  },

  setAppView: (view) => set({ appView: view }),

  setTheme: (theme) => {
    set({ theme })
    window.electronAPI?.storeSet('settings.theme', theme)
  },

  toggleWidgetVisibility: (widgetId) => {
    const updated = { ...get().widgetVisibility, [widgetId]: !get().widgetVisibility[widgetId] }
    set({ widgetVisibility: updated })
    window.electronAPI?.storeSet('settings.widgetVisibility', updated)
  },

  setAcrylicEnabled: (enabled) => {
    set({ acrylicEnabled: enabled })
    window.electronAPI?.storeSet('settings.acrylicEnabled', enabled)
    window.electronAPI?.setWindowMaterial(enabled ? 'acrylic' : 'none')
  },

  resetSettings: () => {
    set(DEFAULTS)
    window.electronAPI?.storeDelete('settings.theme')
    window.electronAPI?.storeDelete('settings.widgetVisibility')
    window.electronAPI?.storeDelete('settings.acrylicEnabled')
  },
}))
