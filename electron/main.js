import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Store from 'electron-store'
import { google } from 'googleapis'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev     = process.env.NODE_ENV !== 'production'
const store     = new Store()
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    show: false,
    webPreferences: {
      // electron-vite outputs ESM preload as .mjs; sandbox:true blocks ESM preloads
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,  // keeps renderer isolated — only contextBridge API exposed
      nodeIntegration: false,  // renderer has no Node access
      sandbox: false,          // required for ESM preload scripts
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    try { mainWindow.setBackgroundMaterial('acrylic') } catch {}
  })

  if (isDev) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── Window controls ──────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.restore() : mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

// ── electron-store bridge ────────────────────────────────────────────
ipcMain.handle('store:get',    (_, key)        => store.get(key) ?? null)
ipcMain.handle('store:set',    (_, key, value) => { store.set(key, value) })
ipcMain.handle('store:delete', (_, key)        => { store.delete(key) })
ipcMain.handle('store:clear',  ()              => { store.clear() })

// ── Shell ────────────────────────────────────────────────────────────
ipcMain.on('shell:openExternal', (_, url) => { shell.openExternal(url) })

// Acrylic / transparency material toggle
ipcMain.on('window:setMaterial', (_, material) => {
  try { mainWindow?.setBackgroundMaterial(material) } catch {}
})

// ── Gmail helpers ────────────────────────────────────────────────────
function makeOAuthClient() {
  return new google.auth.OAuth2(
    store.get('gmail.clientId'),
    store.get('gmail.clientSecret'),
    store.get('gmail.redirectUri'),
  )
}

// gmail:authenticate — opens OAuth window, saves tokens + account info
ipcMain.handle('gmail:authenticate', (_, accountId) => {
  const clientId    = store.get('gmail.clientId')
  const clientSecret = store.get('gmail.clientSecret')
  const redirectUri = store.get('gmail.redirectUri')

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Gmail credentials not configured. Add them in Settings → Email.')
  }

  const oauth2Client = makeOAuthClient()
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope:       ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt:      'consent',
  })

  return new Promise((resolve, reject) => {
    const authWin = new BrowserWindow({
      width: 500,
      height: 660,
      title: 'Sign in with Google',
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    })

    authWin.loadURL(authUrl)

    const handleRedirect = async (event, url) => {
      if (!url.startsWith(redirectUri)) return
      event?.preventDefault?.()

      const code  = new URL(url).searchParams.get('code')
      const error = new URL(url).searchParams.get('error')

      if (error) { authWin.destroy(); reject(new Error(error)); return }
      if (!code) { authWin.destroy(); reject(new Error('No auth code received')); return }

      try {
        const { tokens }  = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        const gmail   = google.gmail({ version: 'v1', auth: oauth2Client })
        const profile = await gmail.users.getProfile({ userId: 'me' })
        const email   = profile.data.emailAddress

        store.set(`gmail.tokens.${accountId}`, tokens)

        const accounts = store.get('gmail.accounts') ?? []
        const idx = accounts.findIndex((a) => a.id === accountId)
        const entry = { id: accountId, email, authenticated: true }
        if (idx >= 0) accounts[idx] = entry
        else accounts.push(entry)
        store.set('gmail.accounts', accounts)

        authWin.destroy()
        resolve({ accountId, email })
      } catch (err) {
        authWin.destroy()
        reject(err)
      }
    }

    authWin.webContents.on('will-navigate', handleRedirect)
    authWin.webContents.on('will-redirect', handleRedirect)
    authWin.on('closed', () => reject(new Error('Authentication cancelled')))
  })
})

// gmail:fetchEmails — uses stored tokens, auto-refreshes, returns email list
ipcMain.handle('gmail:fetchEmails', async (_, { accountId, maxResults = 10 }) => {
  const tokens = store.get(`gmail.tokens.${accountId}`)
  if (!tokens) throw new Error('Account not authenticated')

  const oauth2Client = makeOAuthClient()
  oauth2Client.setCredentials(tokens)

  // Persist refreshed tokens automatically
  oauth2Client.on('tokens', (refreshed) => {
    store.set(`gmail.tokens.${accountId}`, { ...tokens, ...refreshed })
  })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const listRes = await gmail.users.messages.list({
    userId:     'me',
    q:          'is:unread in:inbox',
    maxResults,
  })

  const messages     = listRes.data.messages ?? []
  const unreadCount  = listRes.data.resultSizeEstimate ?? messages.length

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId:          'me',
        id:              msg.id,
        format:          'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      })

      const headers  = detail.data.payload?.headers ?? []
      const getH     = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
      const fromRaw  = getH('From')
      const nameMatch = fromRaw.match(/^(.+?)\s*<([^>]+)>/)

      return {
        id:        msg.id,
        threadId:  detail.data.threadId,
        fromName:  nameMatch ? nameMatch[1].trim() || nameMatch[2] : fromRaw,
        fromEmail: nameMatch ? nameMatch[2] : fromRaw,
        subject:   getH('Subject') || '(no subject)',
        date:      getH('Date'),
        snippet:   detail.data.snippet ?? '',
      }
    })
  )

  return { emails, unreadCount }
})

// gmail:revokeAccount — revokes token, clears from store
ipcMain.handle('gmail:revokeAccount', async (_, accountId) => {
  const tokens = store.get(`gmail.tokens.${accountId}`)
  if (tokens?.access_token) {
    try {
      const client = makeOAuthClient()
      client.setCredentials(tokens)
      await client.revokeToken(tokens.access_token)
    } catch {}
  }
  store.delete(`gmail.tokens.${accountId}`)

  const accounts = (store.get('gmail.accounts') ?? []).map((a) =>
    a.id === accountId ? { ...a, authenticated: false, email: '' } : a
  )
  store.set('gmail.accounts', accounts)
})

// ── Lifecycle ────────────────────────────────────────────────────────
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
