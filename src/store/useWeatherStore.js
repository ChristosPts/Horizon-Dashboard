import { create } from 'zustand'
import axios from 'axios'

const CACHE_MS = 30 * 60 * 1000  // 30 minutes

// Shown whenever no API key is configured
const PLACEHOLDER = {
  isPlaceholder: true,
  cityName: 'Your City',
  current: {
    temp: 22, feelsLike: 20, humidity: 58,
    windSpeed: 14, condition: 'Partly cloudy', iconCode: '02d',
  },
  forecast: [
    { date: 'Mon', tempMin: 17, tempMax: 24, condition: 'Partly cloudy', iconCode: '02d' },
    { date: 'Tue', tempMin: 15, tempMax: 21, condition: 'Light rain',    iconCode: '10d' },
    { date: 'Wed', tempMin: 18, tempMax: 26, condition: 'Clear sky',     iconCode: '01d' },
    { date: 'Thu', tempMin: 16, tempMax: 23, condition: 'Cloudy',        iconCode: '03d' },
    { date: 'Fri', tempMin: 19, tempMax: 27, condition: 'Clear sky',     iconCode: '01d' },
  ],
}

// Group 3-hour OWM forecast slots into daily summaries
function processForecast(list) {
  const days = {}
  list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0]
    if (!days[date]) days[date] = { temps: [], conditions: [], icons: [] }
    days[date].temps.push(item.main.temp)
    days[date].conditions.push(item.weather[0].description)
    days[date].icons.push(item.weather[0].icon)
  })
  // Skip today (index 0) — it's already shown as current
  return Object.entries(days)
    .slice(1, 6)
    .map(([date, { temps, conditions, icons }]) => ({
      date,
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      condition: conditions[Math.floor(conditions.length / 2)],
      iconCode: icons[Math.floor(icons.length / 2)],
    }))
}

export const useWeatherStore = create((set, get) => ({
  apiKey: '',
  cities: [],
  activeCity: '',
  tempUnit: 'celsius',    // 'celsius' | 'fahrenheit'
  displayMode: 'current', // 'current' | '3day' | '5day'
  weatherData: {},        // { [city]: { current, forecast, lastFetched } }
  loading: false,
  error: null,

  loadFromStore: async () => {
    const [apiKey, cities, activeCity, tempUnit, displayMode, weatherData] = await Promise.all([
      window.electronAPI?.storeGet('weather.apiKey'),
      window.electronAPI?.storeGet('weather.cities'),
      window.electronAPI?.storeGet('weather.activeCity'),
      window.electronAPI?.storeGet('weather.tempUnit'),
      window.electronAPI?.storeGet('weather.displayMode'),
      window.electronAPI?.storeGet('weather.data'),
    ])
    const resolvedCities = Array.isArray(cities) && cities.length ? cities : []
    set({
      ...(apiKey ? { apiKey } : {}),
      ...(resolvedCities.length ? {
        cities: resolvedCities,
        activeCity: activeCity && resolvedCities.includes(activeCity) ? activeCity : resolvedCities[0],
      } : {}),
      ...(tempUnit ? { tempUnit } : {}),
      ...(displayMode ? { displayMode } : {}),
      ...(weatherData && typeof weatherData === 'object' ? { weatherData } : {}),
    })
  },

  fetchWeather: async ({ force = false } = {}) => {
    const { apiKey, activeCity, tempUnit, weatherData } = get()
    if (!apiKey || !activeCity) return

    const cached = weatherData[activeCity]
    if (!force && cached?.lastFetched && Date.now() - cached.lastFetched < CACHE_MS) return

    set({ loading: true, error: null })
    try {
      const units = tempUnit === 'celsius' ? 'metric' : 'imperial'
      const [currRes, fcRes] = await Promise.all([
        axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: { q: activeCity, appid: apiKey, units },
        }),
        axios.get('https://api.openweathermap.org/data/2.5/forecast', {
          params: { q: activeCity, appid: apiKey, units, cnt: 40 },
        }),
      ])

      const c = currRes.data
      const entry = {
        isPlaceholder: false,
        cityName: c.name,
        current: {
          temp: Math.round(c.main.temp),
          feelsLike: Math.round(c.main.feels_like),
          humidity: c.main.humidity,
          windSpeed: Math.round(c.wind.speed),
          condition: c.weather[0].description,
          iconCode: c.weather[0].icon,
        },
        forecast: processForecast(fcRes.data.list),
        lastFetched: Date.now(),
      }

      const updated = { ...get().weatherData, [activeCity]: entry }
      set({ weatherData: updated, loading: false })
      window.electronAPI?.storeSet('weather.data', updated)
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message ?? 'Weather data unavailable',
      })
    }
  },

  setActiveCity: (city) => {
    set({ activeCity: city, error: null })
    window.electronAPI?.storeSet('weather.activeCity', city)
    get().fetchWeather()
  },

  setTempUnit: (unit) => {
    // Clear cache so all cities re-fetch in the new unit
    set({ tempUnit: unit, weatherData: {}, error: null })
    window.electronAPI?.storeSet('weather.tempUnit', unit)
    window.electronAPI?.storeSet('weather.data', {})
    get().fetchWeather()
  },

  setDisplayMode: (mode) => {
    set({ displayMode: mode })
    window.electronAPI?.storeSet('weather.displayMode', mode)
  },

  // Returns the data object to render, or PLACEHOLDER if no API key
  getDisplayData: () => {
    const { apiKey, activeCity, weatherData } = get()
    if (!apiKey) return PLACEHOLDER
    return weatherData[activeCity] ?? null
  },
}))
