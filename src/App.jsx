import { useEffect } from 'react'
import { useSettingsStore } from './store/useSettingsStore'
import { useLayoutStore } from './store/useLayoutStore'
import Titlebar from './components/Titlebar'
import Dashboard from './components/Dashboard'
import SettingsPanel from './components/SettingsPanel'
import './styles/globals.css'

export default function App() {
  const { theme, appView, loadFromStore: loadSettings } = useSettingsStore()
  const { loadFromStore: loadLayout } = useLayoutStore()

  useEffect(() => {
    loadSettings()
    loadLayout()
  }, [])

  useEffect(() => {
    const resolved =
      theme === 'auto'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        : theme
    document.documentElement.setAttribute('data-theme', resolved)
  }, [theme])

  return (
    <div className="app-root">
      <Titlebar />
      {appView === 'settings' ? <SettingsPanel /> : <Dashboard />}
    </div>
  )
}
