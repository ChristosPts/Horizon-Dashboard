import { create } from 'zustand'
import axios from 'axios'
import { format } from 'date-fns'

const CACHE_MS  = 2 * 60 * 60 * 1000  // 2 hours
const MAX_CALLS = 100
const API_BASE  = 'https://newsapi.org/v2'

const CATEGORIES = ['all', 'technology', 'business', 'science']

// Shown when no API key is configured
const PLACEHOLDER = [
  { id: 'p1',  title: 'AI assistants are reshaping how developers write code',          source: 'TechCrunch', url: null, publishedAt: new Date(Date.now() -  1 * 3600000).toISOString() },
  { id: 'p2',  title: 'Global markets reach new highs amid positive economic data',      source: 'Reuters',    url: null, publishedAt: new Date(Date.now() -  2 * 3600000).toISOString() },
  { id: 'p3',  title: 'New climate agreement signed by 40 world economies',             source: 'BBC News',   url: null, publishedAt: new Date(Date.now() -  4 * 3600000).toISOString() },
  { id: 'p4',  title: 'SpaceX successfully launches next-generation satellite ring',     source: 'The Verge',  url: null, publishedAt: new Date(Date.now() -  6 * 3600000).toISOString() },
  { id: 'p5',  title: 'Breakthrough in quantum computing cuts error rate by 90%',        source: 'Nature',     url: null, publishedAt: new Date(Date.now() -  8 * 3600000).toISOString() },
  { id: 'p6',  title: 'Major chipmaker unveils 2nm processor architecture',              source: 'Ars Technica', url: null, publishedAt: new Date(Date.now() - 10 * 3600000).toISOString() },
  { id: 'p7',  title: 'Electric vehicle adoption accelerates sharply across Europe',    source: 'Bloomberg',  url: null, publishedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: 'p8',  title: 'Cybersecurity firm discovers critical zero-day in popular VPN',  source: 'Wired',      url: null, publishedAt: new Date(Date.now() - 14 * 3600000).toISOString() },
  { id: 'p9',  title: 'Remote work transformation continues as firms adopt hybrid models', source: 'WSJ',     url: null, publishedAt: new Date(Date.now() - 16 * 3600000).toISOString() },
  { id: 'p10', title: 'New study links urban green spaces to improved mental health',    source: 'Guardian',   url: null, publishedAt: new Date(Date.now() - 20 * 3600000).toISOString() },
]

// Per-category cache shape: { articles: [], lastFetched: null }
const emptyCache = () =>
  Object.fromEntries(CATEGORIES.map((c) => [c, { articles: [], lastFetched: null }]))

export const useNewsStore = create((set, get) => ({
  apiKey:       '',
  category:     'all',
  headlineCount: 10,
  cache:        emptyCache(),
  callsToday:   0,
  lastResetDate: '',
  loading:      false,
  error:        null,

  loadFromStore: async () => {
    const [apiKey, category, headlineCount, cache, callsToday, lastResetDate] = await Promise.all([
      window.electronAPI?.storeGet('news.apiKey'),
      window.electronAPI?.storeGet('news.category'),
      window.electronAPI?.storeGet('news.headlineCount'),
      window.electronAPI?.storeGet('news.cache'),
      window.electronAPI?.storeGet('news.callsToday'),
      window.electronAPI?.storeGet('news.lastResetDate'),
    ])

    // Reset daily counter if it's a new day
    const today = format(new Date(), 'yyyy-MM-dd')
    const freshCalls = lastResetDate === today ? (callsToday ?? 0) : 0
    if (lastResetDate !== today) {
      window.electronAPI?.storeSet('news.callsToday', 0)
      window.electronAPI?.storeSet('news.lastResetDate', today)
    }

    set({
      ...(apiKey ? { apiKey } : {}),
      ...(category ? { category } : {}),
      ...(headlineCount ? { headlineCount } : {}),
      ...(cache && typeof cache === 'object' ? { cache: { ...emptyCache(), ...cache } } : {}),
      callsToday:    freshCalls,
      lastResetDate: today,
    })
  },

  fetchNews: async ({ force = false } = {}) => {
    const { apiKey, category, callsToday, cache } = get()

    if (!apiKey) return  // placeholder mode — no fetch needed

    if (callsToday >= MAX_CALLS) {
      set({ error: `Daily limit reached (${MAX_CALLS}/${MAX_CALLS}) — showing cached headlines` })
      return
    }

    const cached = cache[category]
    if (!force && cached?.lastFetched && Date.now() - cached.lastFetched < CACHE_MS) return

    set({ loading: true, error: null })
    try {
      const params = { apiKey, language: 'en', pageSize: 15 }
      if (category !== 'all') params.category = category

      const res = await axios.get(`${API_BASE}/top-headlines`, { params })

      const articles = res.data.articles
        .filter((a) => a.title && a.title !== '[Removed]' && a.url)
        .map((a, i) => ({
          id:          `${category}-${i}-${Date.now()}`,
          title:       a.title,
          source:      a.source?.name ?? 'Unknown',
          url:         a.url,
          publishedAt: a.publishedAt,
        }))

      const newCallsToday = callsToday + 1
      const newCache = {
        ...get().cache,
        [category]: { articles, lastFetched: Date.now() },
      }

      set({ cache: newCache, callsToday: newCallsToday, loading: false })
      window.electronAPI?.storeSet('news.cache', newCache)
      window.electronAPI?.storeSet('news.callsToday', newCallsToday)
    } catch (err) {
      const msg = err.response?.data?.message ?? 'News unavailable — check API key'
      set({ loading: false, error: msg })
    }
  },

  setCategory: (category) => {
    set({ category })
    window.electronAPI?.storeSet('news.category', category)
    get().fetchNews()
  },

  setHeadlineCount: (n) => {
    set({ headlineCount: n })
    window.electronAPI?.storeSet('news.headlineCount', n)
  },

  // Returns the articles to render (placeholder or real)
  getArticles: () => {
    const { apiKey, category, cache, headlineCount } = get()
    if (!apiKey) return PLACEHOLDER.slice(0, headlineCount)
    return (cache[category]?.articles ?? []).slice(0, headlineCount)
  },

  isPlaceholder: () => !get().apiKey,
}))
