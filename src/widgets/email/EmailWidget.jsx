import { useEffect } from 'react'
import { RefreshCw, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useEmailStore } from '../../store/useEmailStore'

// ── Helpers ──────────────────────────────────────────────────────────
function parseEmailTime(dateStr) {
  if (!dateStr) return ''
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) }
  catch { return '' }
}

// ── EmailRow ─────────────────────────────────────────────────────────
function EmailRow({ email, isPlaceholder }) {
  const open = () => {
    if (!isPlaceholder) {
      window.electronAPI?.openExternal(
        `https://mail.google.com/mail/u/0/#inbox/${email.threadId}`
      )
    }
  }

  return (
    <div
      onClick={open}
      className={`flex flex-col gap-0.5 px-3 py-2.5 transition-colors ${
        isPlaceholder ? 'cursor-default' : 'cursor-pointer'
      }`}
      style={{ borderBottom: '1px solid var(--border-glass)' }}
      onMouseEnter={(e) => { if (!isPlaceholder) e.currentTarget.style.background = 'var(--bg-glass-hover)' }}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {/* Sender + time */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {email.fromName}
        </span>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
          {parseEmailTime(email.date)}
        </span>
      </div>

      {/* Subject */}
      <p className="text-sm font-medium truncate leading-snug" style={{ color: 'var(--text-primary)' }}>
        {email.subject}
      </p>

      {/* Snippet */}
      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
        {email.snippet}
      </p>
    </div>
  )
}

// ── EmailWidget ──────────────────────────────────────────────────────
export default function EmailWidget() {
  const {
    accounts, activeAccountId, emailCount, loading, error,
    loadFromStore, fetchEmails, setActiveAccount, setEmailCount,
    getEmails, isPlaceholder,
  } = useEmailStore()

  const cache        = useEmailStore((s) => s.cache)
  const unreadCount  = cache[activeAccountId]?.unreadCount ?? 0
  const lastFetched  = cache[activeAccountId]?.lastFetched

  useEffect(() => {
    loadFromStore().then(() => fetchEmails())
  }, [])

  const emails      = getEmails()
  const placeholder = isPlaceholder()
  const lastUpdated = lastFetched
    ? formatDistanceToNow(lastFetched, { addSuffix: true })
    : null

  const authAccounts = accounts.filter((a) => a.authenticated)

  return (
    <div className="glass-widget">
      {/* Header */}
      <div className="widget-header widget-drag-handle">
        <div className="flex items-center gap-2">
          <span className="widget-title">Email</span>
          {!placeholder && unreadCount > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {/* Multi-account selector */}
          {authAccounts.length > 1 && (
            <select
              value={activeAccountId}
              onChange={(e) => setActiveAccount(e.target.value)}
              className="text-xs bg-transparent outline-none cursor-pointer max-w-32 truncate"
              style={{ color: 'var(--text-secondary)' }}
            >
              {authAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.email}</option>
              ))}
            </select>
          )}

          {/* Refresh */}
          <button
            onClick={() => fetchEmails({ force: true })}
            disabled={loading || placeholder}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
            title={lastUpdated ? `Updated ${lastUpdated}` : 'Refresh'}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 min-h-0">

        {/* Sample data notice */}
        {placeholder && (
          <div className="flex-shrink-0 px-3 py-1.5" style={{ borderBottom: '1px solid var(--border-glass)' }}>
            <p className="text-xs" style={{ color: 'var(--accent)', opacity: 0.65 }}>
              Sample data · connect Gmail in Settings
            </p>
          </div>
        )}

        {/* Error */}
        {error && !placeholder && (
          <div
            className="flex-shrink-0 px-3 py-1.5"
            style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(248,113,113,0.08)' }}
          >
            <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        {/* Cached data indicator */}
        {!placeholder && lastUpdated && !loading && (
          <div
            className="flex-shrink-0 px-3 py-1 flex items-center gap-1"
            style={{ borderBottom: '1px solid var(--border-glass)' }}
          >
            <Clock size={10} style={{ color: 'var(--text-secondary)' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Updated {lastUpdated}</p>
          </div>
        )}

        {/* Email list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {emails.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {placeholder ? 'Connect Gmail in Settings' : 'No unread emails'}
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <EmailRow key={email.id} email={email} isPlaceholder={placeholder} />
            ))
          )}
        </div>

        {/* Footer — count selector */}
        <div
          className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-glass)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {!placeholder && emails.length > 0 && `${emails.length} unread`}
          </span>
          <div className="flex gap-1">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setEmailCount(n)}
                className="text-xs px-1.5 py-0.5 rounded-md transition-colors"
                style={{
                  background: emailCount === n ? 'var(--accent-glow)' : 'transparent',
                  color:      emailCount === n ? 'var(--accent)'       : 'var(--text-secondary)',
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
