# Horizon Dashboard — Requirements

## Overview

Horizon is a personal desktop dashboard application for Windows 11. It provides an at-a-glance view of emails, weather, news, crypto prices, and productivity tools in a single customizable glassmorphic interface. It is built as both a personal productivity tool and a portfolio piece, with an emphasis on clean code, good documentation, and easy setup for others to clone and customize.

---

## Tech Stack

- **Runtime**: Electron (latest) + Vite
- **UI**: React + JavaScript (ESM only — no CommonJS)
- **Styling**: Tailwind CSS + Custom CSS (glassmorphism, dark/light mode)
- **State**: Zustand
- **Persistence**: electron-store (API keys, settings, todos, calendar, layout)
- **Charts**: Recharts (crypto sparklines)
- **HTTP**: axios — **must use a version that is NOT 1.14.1 or 0.30.4 (both are compromised)**
- **Date utilities**: date-fns
- **Icons**: Lucide React
- **External APIs**: Google APIs (googleapis) for Gmail OAuth, OpenWeatherMap, NewsAPI.org, CoinGecko

---

## Aesthetic

- **Style**: Glassmorphism — subtle borders, minimal shadows
- **Themes**: Dark mode and Light mode (toggled from titlebar)
- **Theming mechanism**: `[data-theme="dark"]` / `[data-theme="light"]` on root `<html>` element
- **Window**: Frameless (no native Windows chrome), transparent background

---

## Window & Titlebar

- Frameless Electron window with transparency (use latest Electron API)
- Custom full-width titlebar containing:
  - **Left**: App logo + name ("Horizon")
  - **Right**: Dashboard icon, Settings icon, Light/Dark toggle, Minimize, Maximize, Close
- No sidebar — titlebar-only navigation

---

## Layout & Customization

- Dashboard is a drag-and-resize grid using `react-grid-layout`
- Widget positions and sizes persisted to electron-store
- Per-widget visibility toggles in Settings → Appearance
- Hidden widgets do not fetch data or render
- Transparent window background for supported systems; acrylic toggle for unsupported

---

## Widgets

Each widget lives in its own self-contained folder under `src/widgets/`.

### Email (Gmail)
- Support for Gmail accounts (initially 2, expandable)
- OAuth via Google APIs (Client ID, Client Secret, Redirect URI)
- Displays: unread count, sender, subject, preview snippet, timestamp
- Click → opens in default browser or Gmail app
- Per-widget settings: number of emails to show (5 / 10 / 15 / 20)
- Error state: "Gmail API key invalid — check Settings"
- Offline: shows cached emails with "Last updated X minutes ago"

### Weather
- API: OpenWeatherMap (free tier, 1,000 calls/day)
- Displays: current conditions + up to 5-day forecast
- Data shown: temperature, condition icon, humidity, wind speed
- Per-widget settings: city selection (multiple), temperature unit (Celsius), display mode (current only / +3-day / +5-day)
- Cache: 30-minute minimum
- Error state: "Weather data unavailable"

### News
- API: NewsAPI.org (free dev tier, 100 calls/day)
- Worldwide headlines only (v1.0 — no per-country filtering)
- Click headline → opens article in browser
- Per-widget settings: number of headlines (5 / 10 / 15), category filter (All / Technology / Business / Science)
- Cache: 2-hour minimum (critical given 100/day limit)
- Settings shows rate limit tracker: "API calls used today: X/100"
- Error/limit state: cached headlines shown with "⚠️ Rate limit reached — showing cached news"

### Crypto
- API: CoinGecko (free, no key required)
- User builds a watchlist in Settings (searchable dropdown → chip list)
- Displays: coin name, price, 24h % change, sparkline mini-chart (Recharts)
- Color coded: green (up) / red (down)
- Per-widget settings: number of coins visible (5 / 10 / 15 / All), sort by (Manual / Price / 24h change), show sparkline (Yes / No)
- Cache: 5-minute minimum

### Calendar (Local)
- Fully local — no external API
- Persisted via electron-store
- Views: Month / Week / Day
- Event fields: Title, Date/Time, Notes, Color tag
- Add / edit / delete events
- Integrated with To-Dos (to-dos with due dates appear on calendar)

### To-Dos / Sticky Notes
- Fully local — persisted via electron-store
- Features: add, edit, complete, delete tasks
- Priority levels: None / Low / Medium / High (color-coded)
- Optional due date (links to Calendar if set)
- Quick notes mode: sticky-note-style cards without dates
- Per-widget settings: display mode (List / Kanban / Sticky notes), show completed (Yes / No), sort by (Priority / Due date / Manual)
- Integrated with Calendar

---

## Settings Page

Tabbed UI, accessible from the titlebar Settings icon. Every tab includes inline instructions for obtaining API keys.

| Tab | Contents |
|---|---|
| Email | Gmail OAuth fields (Client ID, Client Secret, Redirect URI), Connect button, per-widget options |
| Weather | API key, city input, temp unit, display options |
| News | API key, headline count, category filter, rate limit tracker |
| Crypto | Searchable coin selector → chip watchlist, display options |
| Calendar | No settings (local-only) |
| To-Dos | Display mode, show completed toggle |
| Appearance | Theme toggle (Dark / Light / Auto), per-widget visibility toggles, acrylic effect toggle |
| Advanced | Layout reset, clear cache, export/import settings |

---

## Data & Refresh Strategy

### On Startup
All enabled widgets auto-fetch data. Default refresh intervals are set to ~70–80% of each API's rate limit to allow room for manual refreshes:

| Widget | Auto-refresh interval |
|---|---|
| Gmail | 30 minutes |
| Weather | 30 minutes |
| News | 2 hours |
| Crypto | 15 minutes |

### Manual Refresh
- Every widget has a refresh button in its header
- Titlebar "Refresh All" button respects per-widget cache timers to avoid rate limit abuse

### Caching
- All fetched data cached in Zustand store
- Cache persists across Dashboard ↔ Settings navigation
- Cache survives app restarts (stored in electron-store with timestamps)
- Widgets show "Last updated X minutes ago" when serving cached data

### Rate Limit Protection
- News API: hard 100 calls/day limit tracked in Settings
- If limit reached: show cached data + warning banner
- Manual refresh shows confirmation dialog if close to limit

---

## Security

- All API keys and secrets stored in electron-store (local JSON file only — no .env)
- Recommended: encrypt electron-store using `encryptionKey` option
- Encryption key generated via `safeStorage.getPassword()` (Electron built-in)
- Encryption key stored in Windows Credential Manager

---

## Non-Goals (v1.0)

- No calendar sync with external services (Google Calendar, Outlook)
- No multi-monitor support
- No mobile/web build
