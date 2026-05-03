# CLAUDE.md — Horizon Dashboard

This file tells Claude how to work in this codebase. Read it fully before making any changes.

---

## Project Summary

Horizon is a Windows 11 desktop dashboard built with Electron + Vite + React (JavaScript, ESM only). It displays Gmail, weather, news, crypto, a local calendar, and to-dos in a glassmorphic drag-and-resize grid.

---

## Language & Module Rules

- **JavaScript only** — no TypeScript
- **ESM only** — use `import`/`export` everywhere; never `require()` or `module.exports`
- React functional components only — no class components
- No test files needed

---

## Widget Rules

Each widget folder contains its own component(s), local hooks, and styles. Widgets must not import from each other.

Every widget header has two zones:
- **Left** (title + count badge) — draggable, no special treatment needed
- **Right** (action buttons) — must have `onMouseDown={(e) => e.stopPropagation()}` on the wrapper div so button clicks don't bubble up to the react-grid-layout drag handle and accidentally start a drag instead

---

## Styling Rules

- Use Tailwind utility classes as the primary styling method
- Custom CSS only for glassmorphism effects, transparency, and anything Tailwind cannot express
- Theming is driven by `[data-theme="dark"]` / `[data-theme="light"]` on the root `<html>` element — never hardcode colors, always use CSS variables
- Dark mode and light mode must both be accounted for in every component

---

## State Management

- Zustand for all global state — one slice per domain (e.g. `useEmailStore`, `useWeatherStore`, `useCryptoStore`, `useSettingsStore`, `useLayoutStore`)
- electron-store for persistence (API keys, settings, widget layout, todos, calendar events, cached API data with timestamps)
- Never store API keys in `.env` or anywhere outside electron-store

---

## API & Caching Rules

- **axios version**: must NOT be 1.14.1 or 0.30.4 — both are compromised with malware. Always verify the version before installing or upgrading.
- Every API call must check the cache first (read timestamp from electron-store, compare against minimum interval)
- Minimum cache intervals: Gmail 30 min, Weather 30 min, News 2 hours, Crypto 5 min
- News API has a hard 100 calls/day limit — always increment and persist the counter in electron-store
- CoinGecko requires no API key

---

## Electron Rules

- IPC is the only bridge between renderer (React) and main process (Node/electron-store)
- Never expose Node APIs directly to the renderer — use `contextBridge` in preload.js
- Window is frameless with transparency — use the latest Electron API for this
- Custom titlebar handles Minimize / Maximize / Close via IPC

---

## Dependency Notes

- `react-grid-layout` — drag-and-resize dashboard grid
- `recharts` — crypto sparkline charts
- `electron-store` — all persistence
- `date-fns` — all date formatting and manipulation
- `lucide-react` — all icons (no other icon libraries)
- `googleapis` — Gmail OAuth only
- `zustand` — all global state

---

## Do Nots

- Do not add TypeScript or JSX type annotations
- Do not use CommonJS (`require`, `module.exports`)
- Do not import one widget from another
- Do not store secrets in `.env`
- Do not install axios 1.14.1 or 0.30.4
- Do not add a sidebar — navigation is titlebar-only

---

## Milestones

### ✅ Milestone 1 — Scaffold (complete)
Electron + Vite + React shell, frameless transparent window, glassmorphic titlebar (logo, theme toggle, window controls), empty react-grid-layout grid with placeholder widgets, dark/light theme via `data-theme`, electron-store persistence wired up, all Zustand stores initialized.

### ✅ Milestone 2 — To-Dos widget (complete)
Full CRUD, priority levels (None/Low/Medium/High), due dates with color urgency, List/Kanban/Sticky display modes, show/hide completed, cycle sort (Manual/Priority/Due date), persisted to electron-store.

### ✅ Milestone 3 — Weather widget (complete)
OpenWeatherMap integration with 30-min cache, current + 3-day/5-day forecast, °C/°F toggle, multi-city support, lucide weather icons, placeholder sample data when no API key configured.
### ✅ Milestone 4 — Crypto widget (complete)
CoinGecko integration (no API key), default watchlist (BTC/ETH/SOL/ADA/DOGE), Recharts sparklines, live coin search with debounce, remove coin on hover, sort by Manual/Price/24h%, sparkline toggle, visible count selector, 15-min cache + auto-refresh.
### ✅ Milestone 5 — Calendar widget (complete)
Month/Week/Day views, event CRUD with color tags and optional time, EventForm overlay, today/nav buttons, To-Do integration (todos with due dates appear as non-editable chips), all persisted to electron-store.
### ✅ Milestone 6 — News widget (complete)
NewsAPI.org integration, per-category 2-hour cache, daily call counter (resets at midnight), rate limit protection (blocks category switching near limit, refresh disabled at limit), placeholder headlines when no API key, footer shows X/100 calls used.
### ✅ Milestone 7 — Email (Gmail OAuth) widget (complete)
OAuth flow in main process (googleapis, BrowserWindow intercepts redirect), token auto-refresh, multi-account support (account-1/account-2 IDs), fetchEmails via IPC, placeholder sample emails when no account connected, unread count badge, 30-min cache with "Updated X ago" indicator, email count selector (5/10/15/20).
### ✅ Milestone 8 — Settings panel + titlebar nav wiring (complete)
Vertical-tab settings panel (Email/Weather/News/Crypto/Calendar/To-Dos/Appearance/Advanced), titlebar Dashboard↔Settings nav wired, Gmail OAuth connect/disconnect buttons, API key inputs with show/hide, city manager chips, rate-limit progress bar, widget visibility toggles, theme/acrylic toggles, layout reset, cache clear, export/import settings as JSON.
