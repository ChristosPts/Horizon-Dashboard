import { create } from 'zustand'
import axios from 'axios'

const CACHE_MS = 15 * 60 * 1000
const BASE = 'https://api.coingecko.com/api/v3'

const DEFAULT_WATCHLIST = ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin']

// Downsample 168 sparkline points to ~24 for rendering performance
function downsample(prices, target = 24) {
  if (!prices?.length) return []
  const step = Math.max(1, Math.floor(prices.length / target))
  return prices.filter((_, i) => i % step === 0).map((price, i) => ({ i, price }))
}

function sortCoins(coins, sortBy) {
  if (sortBy === 'price')     return [...coins].sort((a, b) => b.price - a.price)
  if (sortBy === 'change24h') return [...coins].sort((a, b) => b.change24h - a.change24h)
  return coins  // manual = watchlist order
}

export const useCryptoStore = create((set, get) => ({
  watchlist:    DEFAULT_WATCHLIST,
  coinData:     {},    // { [id]: { id, name, symbol, price, change24h, sparkline, lastFetched } }
  visibleCount: 'all', // 5 | 10 | 15 | 'all'
  sortBy:       'manual',
  showSparkline: true,
  loading:      false,
  error:        null,

  loadFromStore: async () => {
    const [watchlist, visibleCount, sortBy, showSparkline, coinData] = await Promise.all([
      window.electronAPI?.storeGet('crypto.watchlist'),
      window.electronAPI?.storeGet('crypto.visibleCount'),
      window.electronAPI?.storeGet('crypto.sortBy'),
      window.electronAPI?.storeGet('crypto.showSparkline'),
      window.electronAPI?.storeGet('crypto.data'),
    ])
    set({
      ...(Array.isArray(watchlist) && watchlist.length ? { watchlist } : {}),
      ...(visibleCount !== null && visibleCount !== undefined ? { visibleCount } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(showSparkline !== null && showSparkline !== undefined ? { showSparkline } : {}),
      ...(coinData && typeof coinData === 'object' ? { coinData } : {}),
    })
  },

  fetchCoins: async ({ force = false } = {}) => {
    const { watchlist, coinData } = get()
    if (!watchlist.length) return

    if (!force) {
      const allFresh = watchlist.every((id) => {
        const c = coinData[id]
        return c?.lastFetched && Date.now() - c.lastFetched < CACHE_MS
      })
      if (allFresh) return
    }

    set({ loading: true, error: null })
    try {
      const res = await axios.get(`${BASE}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: watchlist.join(','),
          order: 'market_cap_desc',
          sparkline: true,
          price_change_percentage: '24h',
        },
      })

      const now = Date.now()
      const updated = { ...get().coinData }
      res.data.forEach((coin) => {
        updated[coin.id] = {
          id:         coin.id,
          name:       coin.name,
          symbol:     coin.symbol.toUpperCase(),
          price:      coin.current_price,
          change24h:  coin.price_change_percentage_24h ?? 0,
          sparkline:  downsample(coin.sparkline_in_7d?.price),
          lastFetched: now,
        }
      })

      set({ coinData: updated, loading: false })
      window.electronAPI?.storeSet('crypto.data', updated)
    } catch {
      set({ loading: false, error: 'CoinGecko unavailable — showing cached data' })
    }
  },

  addCoin: (id) => {
    if (get().watchlist.includes(id)) return
    const watchlist = [...get().watchlist, id]
    set({ watchlist })
    window.electronAPI?.storeSet('crypto.watchlist', watchlist)
    get().fetchCoins({ force: true })
  },

  removeCoin: (id) => {
    const watchlist = get().watchlist.filter((c) => c !== id)
    const coinData  = { ...get().coinData }
    delete coinData[id]
    set({ watchlist, coinData })
    window.electronAPI?.storeSet('crypto.watchlist', watchlist)
    window.electronAPI?.storeSet('crypto.data', coinData)
  },

  setVisibleCount: (n) => {
    set({ visibleCount: n })
    window.electronAPI?.storeSet('crypto.visibleCount', n)
  },

  setSortBy: (sortBy) => {
    set({ sortBy })
    window.electronAPI?.storeSet('crypto.sortBy', sortBy)
  },

  setShowSparkline: (show) => {
    set({ showSparkline: show })
    window.electronAPI?.storeSet('crypto.showSparkline', show)
  },

  getSorted: () => {
    const { watchlist, coinData, sortBy } = get()
    const coins = watchlist.map((id) => coinData[id]).filter(Boolean)
    return sortCoins(coins, sortBy)
  },
}))
