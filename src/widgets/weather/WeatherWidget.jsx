import { useEffect } from 'react'
import {
  RefreshCw, Droplets, Wind,
  Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, CloudSnow,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useWeatherStore } from '../../store/useWeatherStore'

// ── Icon map from OWM icon codes ─────────────────────────────────────
const ICON_MAP = {
  '01': Sun,
  '02': Cloud,
  '03': Cloud,
  '04': Cloud,
  '09': CloudDrizzle,
  '10': CloudRain,
  '11': CloudLightning,
  '13': CloudSnow,
  '50': Wind,
}

function WeatherIcon({ code, size = 24, style }) {
  const Icon = ICON_MAP[code?.slice(0, 2)] ?? Cloud
  return <Icon size={size} style={style} />
}

function formatDay(dateStr) {
  // Placeholder data already has short day names
  if (!dateStr || dateStr.length <= 3) return dateStr
  return format(parseISO(dateStr), 'EEE')
}

// ── WeatherWidget ────────────────────────────────────────────────────
export default function WeatherWidget() {
  const {
    apiKey, cities, activeCity, tempUnit, displayMode, loading, error,
    loadFromStore, fetchWeather, setActiveCity, setTempUnit, setDisplayMode,
    getDisplayData,
  } = useWeatherStore()

  useEffect(() => {
    loadFromStore().then(() => fetchWeather())
  }, [])

  const data = getDisplayData()
  const unitSym  = tempUnit === 'celsius' ? '°C' : '°F'
  const windUnit = tempUnit === 'celsius' ? 'm/s' : 'mph'
  const forecastCount = displayMode === '3day' ? 3 : displayMode === '5day' ? 5 : 0

  return (
    <div className="glass-widget">
      {/* Header */}
      <div className="widget-header widget-drag-handle">
        <div className="flex items-center gap-2">
          <span className="widget-title">Weather</span>
          {cities.length > 1 && (
            <select
              value={activeCity}
              onChange={(e) => setActiveCity(e.target.value)}
              className="text-xs bg-transparent outline-none cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {/* Temp unit toggle */}
          <button
            onClick={() => setTempUnit(tempUnit === 'celsius' ? 'fahrenheit' : 'celsius')}
            className="text-xs px-1.5 py-0.5 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Toggle °C / °F"
          >
            °C/°F
          </button>

          {/* Forecast mode */}
          {['current', '3day', '5day'].map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              className="text-xs px-1.5 py-0.5 rounded-md transition-colors"
              style={{
                background: displayMode === mode ? 'var(--accent-glow)' : 'transparent',
                color: displayMode === mode ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {mode === 'current' ? 'Now' : mode === '3day' ? '3d' : '5d'}
            </button>
          ))}

          {/* Refresh */}
          <button
            onClick={() => fetchWeather({ force: true })}
            disabled={loading || data?.isPlaceholder}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="widget-body flex flex-col gap-3 overflow-hidden">

        {/* Placeholder notice */}
        {data?.isPlaceholder && (
          <p className="text-center text-xs" style={{ color: 'var(--accent)', opacity: 0.65 }}>
            Sample data · add API key in Settings
          </p>
        )}

        {/* Error */}
        {error && !data?.isPlaceholder && (
          <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
        )}

        {/* Loading skeleton (no data yet) */}
        {!data && !error && (
          <div className="flex items-center justify-center flex-1">
            <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
          </div>
        )}

        {/* Main weather display */}
        {data && (
          <>
            {/* Current row */}
            <div className="flex items-center gap-3">
              <WeatherIcon
                code={data.current.iconCode}
                size={42}
                style={{ color: 'var(--accent)', opacity: 0.85, flexShrink: 0 }}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-0.5 leading-none">
                  <span className="text-4xl font-light" style={{ color: 'var(--text-primary)' }}>
                    {data.current.temp}
                  </span>
                  <span className="text-base" style={{ color: 'var(--text-secondary)' }}>{unitSym}</span>
                </div>
                <p className="text-xs mt-0.5 capitalize truncate" style={{ color: 'var(--text-secondary)' }}>
                  {data.current.condition}
                </p>
              </div>

              <div className="ml-auto text-right flex-shrink-0">
                <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {data.cityName}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Feels {data.current.feelsLike}{unitSym.replace('°', '°')}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Droplets size={13} style={{ color: 'var(--accent-blue)' }} />
                {data.current.humidity}%
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Wind size={13} style={{ color: 'var(--accent-blue)' }} />
                {data.current.windSpeed} {windUnit}
              </span>
            </div>

            {/* Forecast */}
            {forecastCount > 0 && data.forecast?.length > 0 && (
              <div
                className="flex flex-col gap-1.5 pt-2"
                style={{ borderTop: '1px solid var(--border-glass)' }}
              >
                {data.forecast.slice(0, forecastCount).map((day, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs w-8 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {formatDay(day.date)}
                    </span>
                    <WeatherIcon
                      code={day.iconCode}
                      size={14}
                      style={{ color: 'var(--accent)', flexShrink: 0 }}
                    />
                    <span className="text-xs flex-1 capitalize truncate" style={{ color: 'var(--text-secondary)' }}>
                      {day.condition}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {day.tempMin}°
                      <span style={{ color: 'var(--text-primary)' }}> / {day.tempMax}°</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
