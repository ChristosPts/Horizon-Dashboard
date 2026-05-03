<div align="center">

# Horizon Dashboard

**A personal Windows 11 desktop dashboard with a glassmorphic interface**

Built with Electron · React · Vite · Tailwind CSS

![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D4?logo=windows&logoColor=white)

</div>

---

Horizon is a frameless, transparent desktop dashboard for Windows 11. It sits on your desktop, showing your Gmail inbox, live weather, top news, crypto prices, a personal calendar, and a to-do manager — all in a drag-and-resize glassmorphic grid.

> **Portfolio project.** The code is designed to be clean, well-structured, and easy for others to clone and customise.

---

## Widgets

| Widget | Data source | API key needed |
|--------|-------------|----------------|
| 📧 **Email** | Gmail (OAuth 2.0) | Yes — Google Cloud Console |
| ☁️ **Weather** | OpenWeatherMap | Yes — free tier |
| 📰 **News** | NewsAPI.org | Yes — free tier (100 req/day) |
| 💹 **Crypto** | CoinGecko | **No** — free public API |
| 📅 **Calendar** | Local only | No |
| ✅ **To-Dos** | Local only | No |

All widgets display **sample data** when not configured, so the dashboard looks good from day one.

---

## Features

- **Glassmorphic UI** — frosted glass panels over your Windows wallpaper, with a blue/purple neon accent
- **Dark & light mode** — toggleable from the titlebar, persisted across sessions
- **Drag & resize grid** — every widget is repositionable and resizable; layout is saved automatically
- **Widget visibility** — hide any widget from Settings → Appearance; hidden widgets stop fetching data
- **Smart caching** — every API response is cached (Weather 30 min, News 2 h, Crypto 15 min, Gmail 30 min) and survives app restarts
- **Rate limit protection** — News API's 100 calls/day limit is tracked and displayed; fetches are blocked when the limit is reached
- **Settings panel** — tabbed settings for every widget, accessible from the titlebar
- **Export / Import** — back up and restore all settings and data as a single JSON file

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 33 (frameless, transparent window) |
| Build | electron-vite + Vite 5 |
| UI | React 18 + Tailwind CSS |
| State | Zustand (one store per domain) |
| Persistence | electron-store (API keys, layout, todos, calendar, cached data) |
| Charts | Recharts (crypto sparklines) |
| HTTP | Axios |
| Date utils | date-fns |
| Icons | Lucide React |
| Grid | react-grid-layout |
| Gmail | googleapis (OAuth 2.0, main-process only) |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later
- Windows 10/11 (transparency and acrylic effects require Windows 11)

### Install & run

```bash
git clone https://github.com/your-username/horizon-dashboard.git
cd horizon-dashboard
npm install
npm run dev
```

The app opens immediately with sample data in every widget. Configure API keys in **Settings** (gear icon in the titlebar) whenever you're ready.

---

## API key setup

All keys are stored locally in `electron-store` — never in `.env` files or anywhere outside your machine.

### OpenWeatherMap (Weather widget)

1. Sign up at [openweathermap.org](https://openweathermap.org/api)
2. Go to **API keys** in your account dashboard
3. Copy your default key (or create a new one)
4. In Horizon: **Settings → Weather** → paste the key → **Save**
5. Add one or more cities in the **Cities** section

Free tier: 1,000 calls/day · New keys activate within ~2 hours

---

### NewsAPI.org (News widget)

1. Register at [newsapi.org](https://newsapi.org/register)
2. Your API key is shown immediately after registration
3. In Horizon: **Settings → News** → paste the key → **Save**

Free developer plan: 100 calls/day · The app caches for 2 hours to conserve requests · A usage counter is shown in the widget footer and Settings

---

### CoinGecko (Crypto widget)

No setup needed. The Crypto widget connects to CoinGecko's free public API automatically.

Use the **+** button inside the widget to search and add any coin to your watchlist.

---

### Gmail (Email widget)

Gmail requires an OAuth 2.0 app because Google doesn't allow simple API key access to personal email.

**One-time setup in Google Cloud Console:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project (e.g. "Horizon Dashboard")
3. Navigate to **APIs & Services → Library** → search for **Gmail API** → Enable it
4. Go to **APIs & Services → Credentials** → **Create credentials → OAuth 2.0 Client ID**
5. Application type: **Desktop app**
6. Under **Authorized redirect URIs**, add: `http://localhost`
7. Copy your **Client ID** and **Client Secret**

**In Horizon:**

1. **Settings → Email**
2. Paste Client ID, Client Secret, and Redirect URI (`http://localhost`)
3. Click **Save** under the credentials
4. Click **Connect** next to Account 1 (and optionally Account 2)
5. A Google sign-in window opens — sign in and grant read-only Gmail access
6. The window closes and your inbox loads automatically

> Horizon only requests `gmail.readonly` scope. It cannot send, delete, or modify emails.

---

## Building for distribution

You need a 256×256 (minimum) `.ico` icon file before packaging:

```
public/
└── icon.ico   ← add this before running dist
```

Then run:

```bash
# Produces an NSIS installer + portable .exe in release/
npm run dist

# Produces an unpacked folder (faster, good for testing)
npm run dist:dir
```

Output lands in `release/`. The NSIS installer gives users a standard Windows install/uninstall experience. The portable `.exe` runs without installation.

---

## Project structure

```
horizon-dashboard/
├── electron/
│   ├── main.js          # Main process: window, IPC, Gmail OAuth, electron-store
│   └── preload.js       # contextBridge — the only bridge to the renderer
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # react-grid-layout grid, widget registry
│   │   ├── Titlebar.jsx       # Custom frameless titlebar
│   │   └── SettingsPanel.jsx  # Tabbed settings UI
│   ├── widgets/
│   │   ├── email/
│   │   ├── weather/
│   │   ├── news/
│   │   ├── crypto/
│   │   ├── calendar/
│   │   └── todos/
│   ├── store/
│   │   ├── useSettingsStore.js
│   │   ├── useLayoutStore.js
│   │   ├── useEmailStore.js
│   │   ├── useWeatherStore.js
│   │   ├── useNewsStore.js
│   │   ├── useCryptoStore.js
│   │   ├── useCalendarStore.js
│   │   └── useTodoStore.js
│   ├── styles/
│   │   └── globals.css        # CSS variables, glassmorphism, grid overrides
│   ├── App.jsx
│   └── main.jsx
├── electron.vite.config.js
├── tailwind.config.js
└── package.json
```

**Key architecture rules:**
- Widgets are self-contained — no widget imports from another widget
- All global state lives in Zustand stores (`src/store/`)
- All persistence goes through `electron-store` via IPC — never `.env` files
- All Gmail API calls happen in the **main process** — tokens never touch the renderer
- The only renderer↔main bridge is `contextBridge` in `preload.js`

---

## Customisation

The colour scheme is driven by CSS variables in [`src/styles/globals.css`](src/styles/globals.css). The accent colours (`--accent`, `--accent-blue`) and all glass backgrounds are defined per theme (`[data-theme="dark"]` / `[data-theme="light"]`), so a full theme swap is a single file change.

The default widget layout is defined in [`src/store/useLayoutStore.js`](src/store/useLayoutStore.js). You can reset to defaults at any time from **Settings → Advanced → Reset layout**.

---

## License

MIT — do whatever you like with it.
