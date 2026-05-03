import { useEffect } from 'react'
import { RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useNewsStore } from '../../store/useNewsStore'

// ── Helpers ──────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) }
  catch { return '' }
}

const CATEGORY_LABELS = {
  all:        'All',
  technology: 'Tech',
  business:   'Business',
  science:    'Science',
}

function callCountColor(calls) {
  if (calls >= 100) return '#f87171'
  if (calls >= 80)  return '#fbbf24'
  return 'var(--text-secondary)'
}

// ── ArticleRow ───────────────────────────────────────────────────────
function ArticleRow({ article, isPlaceholder }) {
  const openArticle = () => {
    if (!isPlaceholder && article.url) {
      window.electronAPI?.openExternal(article.url)
    }
  }

  return (
    <div
      onClick={openArticle}
      className={`flex flex-col gap-0.5 px-3 py-2.5 transition-colors ${
        isPlaceholder ? 'cursor-default' : 'cursor-pointer'
      }`}
      style={{ borderBottom: '1px solid var(--border-glass)' }}
      onMouseEnter={(e) => {
        if (!isPlaceholder) e.currentTarget.style.background = 'var(--bg-glass-hover)'
      }}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {/* Source + time */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          {article.source}
        </span>
        {article.publishedAt && (
          <>
            <span style={{ color: 'var(--border-glass)', fontSize: 10 }}>·</span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {timeAgo(article.publishedAt)}
            </span>
          </>
        )}
        {!isPlaceholder && (
          <ExternalLink
            size={10}
            className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100"
            style={{ color: 'var(--text-secondary)' }}
          />
        )}
      </div>

      {/* Headline */}
      <p
        className="text-sm leading-snug line-clamp-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {article.title}
      </p>
    </div>
  )
}

// ── NewsWidget ───────────────────────────────────────────────────────
export default function NewsWidget() {
  const {
    category, headlineCount, callsToday, loading, error,
    loadFromStore, fetchNews, setCategory, setHeadlineCount,
    getArticles, isPlaceholder,
  } = useNewsStore()

  useEffect(() => {
    loadFromStore().then(() => fetchNews())
  }, [])

  const articles    = getArticles()
  const placeholder = isPlaceholder()
  const atLimit     = callsToday >= 100
  const nearLimit   = callsToday >= 80

  return (
    <div className="glass-widget">
      {/* Header */}
      <div className="widget-header widget-drag-handle">
        <div className="flex items-center gap-2">
          <span className="widget-title">News</span>
          {loading && <RefreshCw size={11} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />}
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {/* Category tabs */}
          <div className="flex gap-0.5 rounded-md p-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                disabled={!placeholder && nearLimit && key !== category}
                className="text-xs px-1.5 py-0.5 rounded transition-colors disabled:opacity-40"
                style={{
                  background: category === key ? 'var(--accent-glow)' : 'transparent',
                  color:      category === key ? 'var(--accent)'       : 'var(--text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchNews({ force: true })}
            disabled={loading || placeholder || atLimit}
            title={atLimit ? 'Daily limit reached' : nearLimit ? `${callsToday}/100 calls used` : 'Refresh'}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-30"
            style={{ color: nearLimit ? '#fbbf24' : 'var(--text-secondary)' }}
          >
            {nearLimit && !atLimit
              ? <AlertTriangle size={12} />
              : <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            }
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Banners */}
        {placeholder && (
          <div className="flex-shrink-0 px-3 py-1.5" style={{ borderBottom: '1px solid var(--border-glass)' }}>
            <p className="text-xs" style={{ color: 'var(--accent)', opacity: 0.65 }}>
              Sample data · add NewsAPI key in Settings
            </p>
          </div>
        )}

        {error && !placeholder && (
          <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-1.5" style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(248,113,113,0.08)' }}>
            <AlertTriangle size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        {/* Article list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {articles.length === 0 && !loading ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              No headlines — check your API key in Settings
            </p>
          ) : (
            articles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                isPlaceholder={placeholder}
              />
            ))
          )}
        </div>

        {/* Footer — call counter + visible count selector */}
        <div
          className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-glass)' }}
        >
          {/* API call counter */}
          {!placeholder ? (
            <span className="text-xs tabular-nums" style={{ color: callCountColor(callsToday) }}>
              {callsToday}/100 calls today
            </span>
          ) : (
            <span />
          )}

          {/* Headline count */}
          <div className="flex gap-1">
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                onClick={() => setHeadlineCount(n)}
                className="text-xs px-1.5 py-0.5 rounded-md transition-colors"
                style={{
                  background: headlineCount === n ? 'var(--accent-glow)' : 'transparent',
                  color:      headlineCount === n ? 'var(--accent)'       : 'var(--text-secondary)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
