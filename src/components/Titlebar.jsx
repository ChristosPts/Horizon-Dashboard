import { useState, useEffect } from 'react'
import { Sun, Moon, Settings, LayoutDashboard, Minus, Square, X } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'

export default function Titlebar() {
  const { theme, setTheme, appView, setAppView } = useSettingsStore()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI?.isMaximized().then(setIsMaximized)
  }, [])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <header className="glass-titlebar">
      {/* Logo */}
      <div className="titlebar-logo">
        <div className="logo-mark">H</div>
        <span className="logo-text">Horizon</span>
      </div>

      {/* Nav + window controls */}
      <div className="titlebar-actions">
        <button
          className="titlebar-btn"
          title="Dashboard"
          onClick={() => setAppView('dashboard')}
          style={{ color: appView === 'dashboard' ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <LayoutDashboard size={15} />
        </button>
        <button
          className="titlebar-btn"
          title="Settings"
          onClick={() => setAppView('settings')}
          style={{ color: appView === 'settings' ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <Settings size={15} />
        </button>
        <button className="titlebar-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="titlebar-divider" />

        <button
          className="titlebar-btn"
          title="Minimize"
          onClick={() => window.electronAPI?.minimize()}
        >
          <Minus size={14} />
        </button>
        <button
          className="titlebar-btn"
          title={isMaximized ? 'Restore' : 'Maximize'}
          onClick={() => { window.electronAPI?.maximize(); setIsMaximized((v) => !v) }}
        >
          <Square size={12} />
        </button>
        <button
          className="titlebar-btn titlebar-btn-close"
          title="Close"
          onClick={() => window.electronAPI?.close()}
        >
          <X size={15} />
        </button>
      </div>
    </header>
  )
}
