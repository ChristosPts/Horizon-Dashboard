import { create } from 'zustand'

const CACHE_MS = 30 * 60 * 1000  // 30 minutes

const PLACEHOLDER_EMAILS = [
  {
    id: 'p1', threadId: 'p1',
    fromName: 'Sarah Johnson', fromEmail: 'sarah@example.com',
    subject: 'Project update — Q2 milestones',
    snippet: 'Hi, just wanted to share the latest status on the Q2 deliverables. Everything is on track for the deadline.',
    date: new Date(Date.now() -  0.5 * 3600000).toISOString(),
  },
  {
    id: 'p2', threadId: 'p2',
    fromName: 'GitHub', fromEmail: 'noreply@github.com',
    subject: '[horizon-dashboard] PR: feat/settings-panel',
    snippet: 'mrdeveloper opened a pull request: This PR adds the settings panel with tabbed navigation and API key management.',
    date: new Date(Date.now() -  2 * 3600000).toISOString(),
  },
  {
    id: 'p3', threadId: 'p3',
    fromName: 'Alex Chen', fromEmail: 'alex@example.com',
    subject: 'Re: Coffee this week?',
    snippet: 'Sounds great! How about Thursday at 3pm? The place near the office should work perfectly.',
    date: new Date(Date.now() -  4 * 3600000).toISOString(),
  },
  {
    id: 'p4', threadId: 'p4',
    fromName: 'Vercel', fromEmail: 'noreply@vercel.com',
    subject: 'Deployment succeeded · main → production',
    snippet: 'Your project was successfully deployed. Visit your project dashboard to see the deployment details.',
    date: new Date(Date.now() -  6 * 3600000).toISOString(),
  },
  {
    id: 'p5', threadId: 'p5',
    fromName: 'Calendar', fromEmail: 'calendar-notification@google.com',
    subject: 'Daily standup in 15 minutes',
    snippet: 'This is a reminder that your Daily Standup meeting starts in 15 minutes. Join link is in the event details.',
    date: new Date(Date.now() -  8 * 3600000).toISOString(),
  },
]

export const useEmailStore = create((set, get) => ({
  accounts:        [],   // [{ id, email, authenticated }]
  activeAccountId: '',
  cache:           {},   // { [accountId]: { emails, unreadCount, lastFetched } }
  emailCount:      10,   // 5 | 10 | 15 | 20
  loading:         false,
  error:           null,

  loadFromStore: async () => {
    const [accounts, activeId, emailCount, cache] = await Promise.all([
      window.electronAPI?.storeGet('gmail.accounts'),
      window.electronAPI?.storeGet('gmail.activeAccountId'),
      window.electronAPI?.storeGet('email.emailCount'),
      window.electronAPI?.storeGet('email.cache'),
    ])

    const resolvedAccounts = Array.isArray(accounts) ? accounts : []
    const resolvedActive =
      activeId && resolvedAccounts.find((a) => a.id === activeId)
        ? activeId
        : resolvedAccounts.find((a) => a.authenticated)?.id ?? ''

    set({
      accounts: resolvedAccounts,
      activeAccountId: resolvedActive,
      ...(emailCount ? { emailCount } : {}),
      ...(cache && typeof cache === 'object' ? { cache } : {}),
    })
  },

  fetchEmails: async ({ force = false } = {}) => {
    const { activeAccountId, cache, emailCount, accounts } = get()
    const account = accounts.find((a) => a.id === activeAccountId)
    if (!account?.authenticated) return

    const cached = cache[activeAccountId]
    if (!force && cached?.lastFetched && Date.now() - cached.lastFetched < CACHE_MS) return

    set({ loading: true, error: null })
    try {
      const { emails, unreadCount } = await window.electronAPI.gmail.fetchEmails({
        accountId:  activeAccountId,
        maxResults: emailCount,
      })

      const newCache = {
        ...get().cache,
        [activeAccountId]: { emails, unreadCount, lastFetched: Date.now() },
      }

      set({ cache: newCache, loading: false })
      window.electronAPI?.storeSet('email.cache', newCache)
    } catch (err) {
      set({ loading: false, error: err.message ?? 'Failed to fetch emails' })
    }
  },

  // Triggered from Settings; accountId like 'account-1', 'account-2'
  authenticate: async (accountId) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.gmail.authenticate(accountId)
      // Main process already saved tokens + updated gmail.accounts in electron-store
      const accounts = await window.electronAPI.storeGet('gmail.accounts')
      set({ accounts: accounts ?? [], activeAccountId: accountId, loading: false })
      get().fetchEmails({ force: true })
    } catch (err) {
      set({ loading: false, error: err.message ?? 'Authentication failed' })
    }
  },

  revokeAccount: async (accountId) => {
    await window.electronAPI.gmail.revokeAccount(accountId)
    const accounts = await window.electronAPI.storeGet('gmail.accounts') ?? []
    const newActive = accountId === get().activeAccountId
      ? accounts.find((a) => a.authenticated && a.id !== accountId)?.id ?? ''
      : get().activeAccountId
    set({ accounts, activeAccountId: newActive })
  },

  setActiveAccount: (id) => {
    set({ activeAccountId: id })
    window.electronAPI?.storeSet('gmail.activeAccountId', id)
    get().fetchEmails()
  },

  setEmailCount: (n) => {
    set({ emailCount: n })
    window.electronAPI?.storeSet('email.emailCount', n)
  },

  getEmails: () => {
    const { activeAccountId, cache, emailCount, accounts } = get()
    const account = accounts.find((a) => a.id === activeAccountId)
    if (!account?.authenticated) return PLACEHOLDER_EMAILS.slice(0, emailCount)
    return (cache[activeAccountId]?.emails ?? []).slice(0, emailCount)
  },

  isPlaceholder: () => {
    const { activeAccountId, accounts } = get()
    return !accounts.find((a) => a.id === activeAccountId && a.authenticated)
  },
}))
