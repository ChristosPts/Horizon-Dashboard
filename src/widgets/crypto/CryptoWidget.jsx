import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, RefreshCw, BarChart2, X, ArrowUpDown } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import { useCryptoStore } from '../../store/useCryptoStore'

const SEARCH_BASE = 'https://api.coingecko.com/api/v3'

const SORT_LABELS = { manual: 'Manual', price: 'Price', change24h: '24h %' }

// ── Helpers ──────────────────────────────────────────────────────────
function formatPrice(price) {
  if (price == null) return '—'
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 1)    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

// ── Sparkline ────────────────────────────────────────────────────────
function Sparkline({ data, positive }) {
  if (!data?.length) return <div style={{ width: 56, height: 28, flexShrink: 0 }} />
  return (
    <div style={{ width: 56, height: 28, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="price"
            stroke={positive ? '#34d399' : '#f87171'}
            strokeWidth={1.5}
            fill={positive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Coin search popover ──────────────────────────────────────────────
function CoinSearch({ existingIds, onAdd, onClose }) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const search = useCallback((q) => {
    clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await axios.get(`${SEARCH_BASE}/search`, { params: { query: q } })
        setResults(res.data.coins.slice(0, 7))
      } catch {}
      setSearching(false)
    }, 350)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div
      className="flex flex-col gap-1 rounded-xl p-2 flex-shrink-0"
      style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)' }}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-1">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          placeholder="Search coins…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {searching && <RefreshCw size={11} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />}
        <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
          <X size={13} />
        </button>
      </div>

      {/* Results */}
      {results.map((coin) => {
        const already = existingIds.includes(coin.id)
        return (
          <button
            key={coin.id}
            disabled={already}
            onClick={() => { onAdd(coin.id); onClose() }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors disabled:opacity-40"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => { if (!already) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          >
            {coin.thumb
              ? <img src={coin.thumb} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full flex-shrink-0" />
              : <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-glow)' }} />
            }
            <span className="text-sm">{coin.name}</span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
              {coin.symbol?.toUpperCase()}
            </span>
            {already && (
              <span className="text-xs" style={{ color: 'var(--accent)' }}>added</span>
            )}
          </button>
        )
      })}

      {query && !searching && results.length === 0 && (
        <p className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }}>No results</p>
      )}
    </div>
  )
}

// ── Single coin row ──────────────────────────────────────────────────
function CoinRow({ coin, showSparkline, onRemove }) {
  const positive = coin.change24h >= 0
  return (
    <div
      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {/* Symbol */}
      <span className="text-xs font-bold w-10 flex-shrink-0 truncate" style={{ color: 'var(--accent)' }}>
        {coin.symbol}
      </span>

      {/* Name */}
      <span className="text-sm flex-1 truncate min-w-0" style={{ color: 'var(--text-primary)' }}>
        {coin.name}
      </span>

      {/* Sparkline */}
      {showSparkline && <Sparkline data={coin.sparkline} positive={positive} />}

      {/* Price */}
      <span className="text-sm tabular-nums flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
        {formatPrice(coin.price)}
      </span>

      {/* 24h % */}
      <span
        className="text-xs tabular-nums w-14 text-right flex-shrink-0"
        style={{ color: positive ? '#34d399' : '#f87171' }}
      >
        {positive ? '+' : ''}{coin.change24h?.toFixed(2)}%
      </span>

      {/* Remove */}
      <button
        onClick={() => onRemove(coin.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ── CryptoWidget ─────────────────────────────────────────────────────
export default function CryptoWidget() {
  const {
    watchlist, visibleCount, sortBy, showSparkline, loading, error,
    loadFromStore, fetchCoins, addCoin, removeCoin,
    setVisibleCount, setSortBy, setShowSparkline, getSorted,
  } = useCryptoStore()

  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    loadFromStore().then(() => fetchCoins())
  }, [])

  // Auto-refresh every 15 min — reads store directly to avoid stale closure
  useEffect(() => {
    const id = setInterval(() => useCryptoStore.getState().fetchCoins(), 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const sorted  = getSorted()
  const visible = visibleCount === 'all' ? sorted : sorted.slice(0, Number(visibleCount))

  return (
    <div className="glass-widget">
      {/* Header */}
      <div className="widget-header widget-drag-handle">
        <div className="flex items-center gap-2">
          <span className="widget-title">Crypto</span>
          {loading && <RefreshCw size={11} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />}
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {/* Sparkline toggle */}
          <button
            onClick={() => setShowSparkline(!showSparkline)}
            title={`Sparklines: ${showSparkline ? 'on' : 'off'}`}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: showSparkline ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <BarChart2 size={13} />
          </button>

          {/* Sort cycle */}
          <button
            onClick={() => {
              const order = ['manual', 'price', 'change24h']
              setSortBy(order[(order.indexOf(sortBy) + 1) % order.length])
            }}
            title={`Sort: ${SORT_LABELS[sortBy]}`}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowUpDown size={13} />
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchCoins({ force: true })}
            disabled={loading}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Add coin */}
          <button
            onClick={() => setShowSearch((v) => !v)}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: showSearch ? 'var(--accent)' : 'var(--text-secondary)' }}
            title="Add coin"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="widget-body flex flex-col gap-1.5 min-h-0 overflow-hidden">
        {/* Search */}
        {showSearch && (
          <CoinSearch
            existingIds={watchlist}
            onAdd={addCoin}
            onClose={() => setShowSearch(false)}
          />
        )}

        {/* Error banner */}
        {error && (
          <p className="text-xs text-center px-2" style={{ color: '#f87171' }}>{error}</p>
        )}

        {/* Coin list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {visible.length === 0 ? (
            <p className="text-center text-xs py-6" style={{ color: 'var(--text-secondary)' }}>
              {watchlist.length === 0
                ? 'Add coins with the + button'
                : 'Fetching prices…'}
            </p>
          ) : (
            visible.map((coin) => (
              <CoinRow
                key={coin.id}
                coin={coin}
                showSparkline={showSparkline}
                onRemove={removeCoin}
              />
            ))
          )}
        </div>

        {/* Visible count selector — only when there are more than 5 coins */}
        {sorted.length > 5 && (
          <div
            className="flex items-center gap-1 pt-1.5 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-glass)' }}
          >
            <span className="text-xs mr-1" style={{ color: 'var(--text-secondary)' }}>Show</span>
            {[5, 10, 15, 'all'].map((n) => (
              <button
                key={n}
                onClick={() => setVisibleCount(n)}
                className="text-xs px-1.5 py-0.5 rounded-md transition-colors"
                style={{
                  background: visibleCount === n ? 'var(--accent-glow)' : 'transparent',
                  color:      visibleCount === n ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {n === 'all' ? 'All' : n}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
