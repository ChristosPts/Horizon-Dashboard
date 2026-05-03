import { useState, useEffect } from 'react'
import {
  Eye, EyeOff, X, Plus, RotateCcw, Download, Upload,
  Mail, Cloud, Newspaper, TrendingUp, Calendar, CheckSquare,
  Palette, Settings, RefreshCw,
} from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useLayoutStore } from '../store/useLayoutStore'
import { useWeatherStore } from '../store/useWeatherStore'
import { useNewsStore } from '../store/useNewsStore'
import { useCryptoStore } from '../store/useCryptoStore'
import { useTodoStore } from '../store/useTodoStore'
import { useEmailStore } from '../store/useEmailStore'

// ── Reusable primitives ──────────────────────────────────────────────

function Section({ title, hint, children }) {
  return (
    <div className="pb-6 mb-6" style={{ borderBottom: '1px solid var(--border-glass)' }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {hint && <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{hint}</p>}
      {children}
    </div>
  )
}

function SettingInput({ label, type = 'text', value, onChange, placeholder, masked }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type={masked && !show ? 'password' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm px-3 py-2 rounded-lg outline-none transition-colors"
          style={{
            background:  'var(--bg-glass-hover)',
            border:      '1px solid var(--border-glass)',
            color:       'var(--text-primary)',
            colorScheme: 'dark',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e)  => (e.target.style.borderColor = 'var(--border-glass)')}
        />
        {masked && (
          <button
            onClick={() => setShow((v) => !v)}
            className="flex-shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  )
}

function SaveRow({ isDirty, onSave, onDiscard, saving }) {
  if (!isDirty) return null
  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={onSave}
        disabled={saving}
        className="text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
        style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button
        onClick={onDiscard}
        className="text-xs px-3 py-1.5 rounded-md"
        style={{ color: 'var(--text-secondary)' }}
      >
        Discard
      </button>
    </div>
  )
}

function Chip({ label, onRemove }) {
  return (
    <span
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
      style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
    >
      {label}
      <button onClick={onRemove} className="ml-0.5">
        <X size={11} />
      </button>
    </span>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg p-1" style={{ background: 'var(--bg-glass)' }}>
      {options.map(({ label, value: v }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="text-xs px-3 py-1.5 rounded-md transition-colors"
          style={{
            background: value === v ? 'var(--accent-glow)' : 'transparent',
            color:      value === v ? 'var(--accent)'       : 'var(--text-secondary)',
            fontWeight: value === v ? 600 : 400,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-10 h-5 rounded-full transition-colors relative flex-shrink-0"
        style={{ background: value ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}
      >
        <span
          className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

// ── Email Tab ────────────────────────────────────────────────────────
function EmailTab() {
  const { accounts, emailCount, authenticate, revokeAccount, setEmailCount, loading, error } = useEmailStore()
  const [clientId,     setClientId]     = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [redirectUri,  setRedirectUri]  = useState('')
  const [credsDirty,   setCredsDirty]   = useState(false)
  const [saving,       setSaving]       = useState(false)

  // Load saved credentials on mount
  useEffect(() => {
    Promise.all([
      window.electronAPI?.storeGet('gmail.clientId'),
      window.electronAPI?.storeGet('gmail.clientSecret'),
      window.electronAPI?.storeGet('gmail.redirectUri'),
    ]).then(([id, secret, uri]) => {
      if (id)     setClientId(id)
      if (secret) setClientSecret(secret)
      if (uri)    setRedirectUri(uri)
    })
  }, [])

  const saveCredentials = async () => {
    setSaving(true)
    await Promise.all([
      window.electronAPI?.storeSet('gmail.clientId',     clientId),
      window.electronAPI?.storeSet('gmail.clientSecret', clientSecret),
      window.electronAPI?.storeSet('gmail.redirectUri',  redirectUri),
    ])
    setSaving(false)
    setCredsDirty(false)
  }

  const ACCOUNT_IDS = ['account-1', 'account-2']

  return (
    <div>
      <Section
        title="Google OAuth Credentials"
        hint="Create a project in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Desktop app). Add your Redirect URI to the Authorized redirect URIs list."
      >
        <div className="flex flex-col gap-3">
          <SettingInput
            label="Client ID"
            value={clientId}
            onChange={(v) => { setClientId(v); setCredsDirty(true) }}
            placeholder="xxxxxx.apps.googleusercontent.com"
          />
          <SettingInput
            label="Client Secret"
            value={clientSecret}
            onChange={(v) => { setClientSecret(v); setCredsDirty(true) }}
            placeholder="GOCSPX-…"
            masked
          />
          <SettingInput
            label="Redirect URI"
            value={redirectUri}
            onChange={(v) => { setRedirectUri(v); setCredsDirty(true) }}
            placeholder="http://localhost"
          />
        </div>
        <SaveRow isDirty={credsDirty} onSave={saveCredentials} onDiscard={() => setCredsDirty(false)} saving={saving} />
      </Section>

      <Section title="Gmail Accounts" hint="Connect up to 2 Gmail accounts. Each uses the credentials above.">
        {error && <p className="text-xs mb-3" style={{ color: '#f87171' }}>{error}</p>}
        <div className="flex flex-col gap-3">
          {ACCOUNT_IDS.map((id, i) => {
            const account = accounts.find((a) => a.id === id)
            return (
              <div
                key={id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Account {i + 1}
                  </p>
                  {account?.authenticated && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{account.email}</p>
                  )}
                  {!account?.authenticated && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Not connected</p>
                  )}
                </div>
                {account?.authenticated ? (
                  <button
                    onClick={() => revokeAccount(id)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => authenticate(id)}
                    disabled={loading || !clientId || !clientSecret || !redirectUri}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
                    style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
                  >
                    {loading ? 'Connecting…' : 'Connect'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Display">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Emails to show</span>
          <SegmentedControl
            options={[5, 10, 15, 20].map((n) => ({ label: String(n), value: n }))}
            value={emailCount}
            onChange={setEmailCount}
          />
        </div>
      </Section>
    </div>
  )
}

// ── Weather Tab ──────────────────────────────────────────────────────
function WeatherTab() {
  const { apiKey: savedKey, cities, tempUnit, displayMode, setTempUnit, setDisplayMode } = useWeatherStore()
  const [apiKey,     setApiKeyLocal] = useState(savedKey)
  const [keyDirty,   setKeyDirty]   = useState(false)
  const [cityInput,  setCityInput]  = useState('')
  const [saving,     setSaving]     = useState(false)

  const saveKey = async () => {
    setSaving(true)
    await window.electronAPI?.storeSet('weather.apiKey', apiKey)
    await useWeatherStore.getState().loadFromStore()
    useWeatherStore.getState().fetchWeather({ force: true })
    setSaving(false)
    setKeyDirty(false)
  }

  const addCity = () => {
    const city = cityInput.trim()
    if (!city || cities.includes(city)) return
    const updated = [...cities, city]
    useWeatherStore.setState({ cities: updated, activeCity: useWeatherStore.getState().activeCity || city })
    window.electronAPI?.storeSet('weather.cities', updated)
    window.electronAPI?.storeSet('weather.activeCity', useWeatherStore.getState().activeCity || city)
    setCityInput('')
  }

  const removeCity = (city) => {
    const updated = cities.filter((c) => c !== city)
    const active  = useWeatherStore.getState().activeCity
    const newActive = updated.includes(active) ? active : updated[0] ?? ''
    useWeatherStore.setState({ cities: updated, activeCity: newActive })
    window.electronAPI?.storeSet('weather.cities', updated)
    window.electronAPI?.storeSet('weather.activeCity', newActive)
  }

  return (
    <div>
      <Section
        title="OpenWeatherMap API Key"
        hint="Sign up at openweathermap.org → API keys. Free tier allows 1,000 calls/day."
      >
        <SettingInput
          value={apiKey}
          onChange={(v) => { setApiKeyLocal(v); setKeyDirty(true) }}
          placeholder="Your API key"
          masked
        />
        <SaveRow isDirty={keyDirty} onSave={saveKey} onDiscard={() => { setApiKeyLocal(savedKey); setKeyDirty(false) }} saving={saving} />
      </Section>

      <Section title="Cities">
        <div className="flex gap-2 mb-3">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCity()}
            placeholder="Add a city…"
            className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
            style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e)  => (e.target.style.borderColor = 'var(--border-glass)')}
          />
          <button
            onClick={addCity}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cities.map((c) => <Chip key={c} label={c} onRemove={() => removeCity(c)} />)}
          {cities.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No cities added yet</p>
          )}
        </div>
      </Section>

      <Section title="Display Options">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Temperature unit</span>
            <SegmentedControl
              options={[{ label: '°C', value: 'celsius' }, { label: '°F', value: 'fahrenheit' }]}
              value={tempUnit}
              onChange={setTempUnit}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Forecast</span>
            <SegmentedControl
              options={[{ label: 'Now', value: 'current' }, { label: '3 day', value: '3day' }, { label: '5 day', value: '5day' }]}
              value={displayMode}
              onChange={setDisplayMode}
            />
          </div>
        </div>
      </Section>
    </div>
  )
}

// ── News Tab ─────────────────────────────────────────────────────────
function NewsTab() {
  const { apiKey: savedKey, category, headlineCount, callsToday, setCategory, setHeadlineCount } = useNewsStore()
  const [apiKey,   setApiKeyLocal] = useState(savedKey)
  const [keyDirty, setKeyDirty]   = useState(false)
  const [saving,   setSaving]     = useState(false)

  const saveKey = async () => {
    setSaving(true)
    await window.electronAPI?.storeSet('news.apiKey', apiKey)
    await useNewsStore.getState().loadFromStore()
    useNewsStore.getState().fetchNews({ force: true })
    setSaving(false)
    setKeyDirty(false)
  }

  const pct = Math.round((callsToday / 100) * 100)

  return (
    <div>
      <Section
        title="NewsAPI.org API Key"
        hint="Sign up at newsapi.org → API key. Free developer plan: 100 calls/day. The app caches responses for 2 hours to conserve calls."
      >
        <SettingInput
          value={apiKey}
          onChange={(v) => { setApiKeyLocal(v); setKeyDirty(true) }}
          placeholder="Your API key"
          masked
        />
        <SaveRow isDirty={keyDirty} onSave={saveKey} onDiscard={() => { setApiKeyLocal(savedKey); setKeyDirty(false) }} saving={saving} />
      </Section>

      <Section title="Rate Limit">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>API calls used today</span>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: callsToday >= 100 ? '#f87171' : callsToday >= 80 ? '#fbbf24' : 'var(--accent)' }}
          >
            {callsToday} / 100
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width:      `${Math.min(pct, 100)}%`,
              background: callsToday >= 100 ? '#f87171' : callsToday >= 80 ? '#fbbf24' : 'var(--accent)',
            }}
          />
        </div>
      </Section>

      <Section title="Display Options">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Category</span>
            <SegmentedControl
              options={['all', 'technology', 'business', 'science'].map((c) => ({
                label: c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1),
                value: c,
              }))}
              value={category}
              onChange={setCategory}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Headlines to show</span>
            <SegmentedControl
              options={[5, 10, 15].map((n) => ({ label: String(n), value: n }))}
              value={headlineCount}
              onChange={setHeadlineCount}
            />
          </div>
        </div>
      </Section>
    </div>
  )
}

// ── Crypto Tab ───────────────────────────────────────────────────────
function CryptoTab() {
  const { sortBy, showSparkline, visibleCount, setSortBy, setShowSparkline, setVisibleCount } = useCryptoStore()
  return (
    <div>
      <Section title="CoinGecko" hint="CoinGecko is used for price data. No API key required — the free public API is used automatically.">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
          style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)' }}
        >
          <span className="text-xl">✓</span>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Connected</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Free public API · no key required</p>
          </div>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          Add or remove coins using the <strong>+</strong> button inside the Crypto widget.
        </p>
      </Section>

      <Section title="Display Options">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Sort by</span>
            <SegmentedControl
              options={[{ label: 'Manual', value: 'manual' }, { label: 'Price', value: 'price' }, { label: '24h %', value: 'change24h' }]}
              value={sortBy}
              onChange={setSortBy}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Visible coins</span>
            <SegmentedControl
              options={[5, 10, 15, 'all'].map((n) => ({ label: n === 'all' ? 'All' : String(n), value: n }))}
              value={visibleCount}
              onChange={setVisibleCount}
            />
          </div>
          <Toggle label="Show sparklines" value={showSparkline} onChange={setShowSparkline} />
        </div>
      </Section>
    </div>
  )
}

// ── Calendar Tab ─────────────────────────────────────────────────────
function CalendarTab() {
  return (
    <div>
      <Section title="Calendar" hint="The calendar is fully local — all events are stored on your device. No external API or account required.">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)' }}
        >
          <Calendar size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Events and todos with due dates are stored in electron-store on your machine. Nothing is synced to the cloud.
          </p>
        </div>
      </Section>
    </div>
  )
}

// ── To-Dos Tab ───────────────────────────────────────────────────────
function TodosTab() {
  const { displayMode, showCompleted, sortBy, setDisplayMode, setShowCompleted } = useTodoStore()
  return (
    <div>
      <Section title="Display Options">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Display mode</span>
            <SegmentedControl
              options={[{ label: 'List', value: 'list' }, { label: 'Kanban', value: 'kanban' }, { label: 'Sticky', value: 'sticky' }]}
              value={displayMode}
              onChange={setDisplayMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Sort by</span>
            <SegmentedControl
              options={[{ label: 'Manual', value: 'manual' }, { label: 'Priority', value: 'priority' }, { label: 'Due date', value: 'dueDate' }]}
              value={sortBy}
              onChange={(v) => { useTodoStore.setState({ sortBy: v }); window.electronAPI?.storeSet('todos.sortBy', v) }}
            />
          </div>
          <Toggle label="Show completed tasks" value={showCompleted} onChange={setShowCompleted} />
        </div>
      </Section>
    </div>
  )
}

// ── Appearance Tab ───────────────────────────────────────────────────
function AppearanceTab() {
  const {
    theme, widgetVisibility, acrylicEnabled,
    setTheme, toggleWidgetVisibility, setAcrylicEnabled,
  } = useSettingsStore()

  const WIDGET_LABELS = {
    email: 'Email', weather: 'Weather', news: 'News',
    crypto: 'Crypto', calendar: 'Calendar', todos: 'To-Dos',
  }

  const WIDGET_ICONS = {
    email: Mail, weather: Cloud, news: Newspaper,
    crypto: TrendingUp, calendar: Calendar, todos: CheckSquare,
  }

  return (
    <div>
      <Section title="Theme">
        <SegmentedControl
          options={[{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }, { label: 'Auto', value: 'auto' }]}
          value={theme}
          onChange={setTheme}
        />
      </Section>

      <Section title="Widget Visibility" hint="Hidden widgets are removed from the grid and stop fetching data.">
        <div className="flex flex-col">
          {Object.entries(WIDGET_LABELS).map(([id, label]) => {
            const Icon = WIDGET_ICONS[id]
            return (
              <div key={id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <div className="flex items-center gap-2">
                  <Icon size={15} style={{ color: 'var(--accent)', opacity: 0.7 }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
                </div>
                {/* Inline switch — avoids empty-label Toggle wrapper */}
                <button
                  onClick={() => toggleWidgetVisibility(id)}
                  className="w-10 h-5 rounded-full transition-colors relative flex-shrink-0"
                  style={{ background: widgetVisibility[id] ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}
                >
                  <span
                    className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: widgetVisibility[id] ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Window Effects" hint="Acrylic effect is only available on Windows 11.">
        <Toggle label="Acrylic background blur" value={acrylicEnabled} onChange={setAcrylicEnabled} />
      </Section>
    </div>
  )
}

// ── Advanced Tab ─────────────────────────────────────────────────────
function AdvancedTab() {
  const { resetLayout } = useLayoutStore()
  const [importing, setImporting] = useState(false)
  const [msg,       setMsg]       = useState('')

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const clearCache = async () => {
    const cacheKeys = ['weather.data', 'news.cache', 'crypto.data', 'email.cache']
    await Promise.all(cacheKeys.map((k) => window.electronAPI?.storeDelete(k)))
    flash('Cache cleared')
  }

  const exportSettings = async () => {
    const keys = [
      'settings.theme', 'settings.widgetVisibility', 'settings.acrylicEnabled',
      'layout', 'todos.items', 'todos.displayMode', 'todos.showCompleted', 'todos.sortBy',
      'calendar.events', 'calendar.view',
      'crypto.watchlist', 'crypto.visibleCount', 'crypto.sortBy', 'crypto.showSparkline',
      'weather.cities', 'weather.tempUnit', 'weather.displayMode',
      'news.category', 'news.headlineCount',
    ]
    const data = {}
    for (const key of keys) {
      const val = await window.electronAPI?.storeGet(key)
      if (val !== null && val !== undefined) data[key] = val
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `horizon-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('Settings exported')
  }

  const importSettings = async (file) => {
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      for (const [key, value] of Object.entries(data)) {
        await window.electronAPI?.storeSet(key, value)
      }
      flash('Settings imported — reloading…')
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      flash('Import failed: invalid file')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <Section title="Layout">
        <button
          onClick={() => { resetLayout(); flash('Layout reset to default') }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}
        >
          <RotateCcw size={14} />
          Reset layout to default
        </button>
      </Section>

      <Section title="Cache" hint="Clears all cached API responses. Data will be re-fetched on next refresh.">
        <button
          onClick={clearCache}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}
        >
          <RefreshCw size={14} />
          Clear all cached data
        </button>
      </Section>

      <Section title="Backup & Restore" hint="Export your settings, layout, and widget data as a JSON file. API keys and Gmail tokens are not included.">
        <div className="flex gap-3">
          <button
            onClick={exportSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}
          >
            <Download size={14} />
            Export settings
          </button>
          <label
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors"
            style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}
          >
            <Upload size={14} />
            {importing ? 'Importing…' : 'Import settings'}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => importSettings(e.target.files?.[0])}
            />
          </label>
        </div>
      </Section>

      {msg && (
        <div
          className="px-4 py-2.5 rounded-lg text-sm"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
        >
          {msg}
        </div>
      )}
    </div>
  )
}

// ── Tab definitions ──────────────────────────────────────────────────
const TABS = [
  { id: 'email',      label: 'Email',      Icon: Mail,        Content: EmailTab },
  { id: 'weather',    label: 'Weather',    Icon: Cloud,       Content: WeatherTab },
  { id: 'news',       label: 'News',       Icon: Newspaper,   Content: NewsTab },
  { id: 'crypto',     label: 'Crypto',     Icon: TrendingUp,  Content: CryptoTab },
  { id: 'calendar',   label: 'Calendar',   Icon: Calendar,    Content: CalendarTab },
  { id: 'todos',      label: 'To-Dos',     Icon: CheckSquare, Content: TodosTab },
  { id: 'appearance', label: 'Appearance', Icon: Palette,     Content: AppearanceTab },
  { id: 'advanced',   label: 'Advanced',   Icon: Settings,    Content: AdvancedTab },
]

// ── SettingsPanel ────────────────────────────────────────────────────
export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('email')
  const { Content } = TABS.find((t) => t.id === activeTab)

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Sidebar */}
      <nav
        className="flex-shrink-0 flex flex-col py-3 px-2 gap-0.5 overflow-y-auto"
        style={{
          width: 176,
          borderRight:    '1px solid var(--border-glass)',
          background:     'var(--bg-titlebar)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest px-3 py-2 mb-1" style={{ color: 'var(--text-secondary)' }}>
          Settings
        </p>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors w-full"
            style={{
              background: activeTab === id ? 'var(--accent-glow)' : 'transparent',
              color:      activeTab === id ? 'var(--accent)'       : 'var(--text-secondary)',
              fontWeight: activeTab === id ? 600 : 400,
            }}
          >
            <Icon size={15} style={{ flexShrink: 0 }} />
            {label}
          </button>
        ))}
      </nav>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-8 min-w-0">
        <Content />
      </div>
    </div>
  )
}
