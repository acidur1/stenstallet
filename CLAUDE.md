# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build → dist/
firebase deploy --only functions   # Deploy Cloud Functions

# Docker
docker compose -f docker-compose.local.yml up --build   # Test image locally → localhost:8080
docker compose up -d --build                            # Run on the server (behind Traefik)
```

## Architecture

Single-page React app (no router) — tab state drives which view is shown. All state lives in `App.jsx` and is passed down as props.

**Data flow:** Firebase Firestore → `onSnapshot` listeners in `App.jsx` → props → view components. Writes go through `saveDoc()` in `src/firebase.js`.

**Firestore structure:**
- `config/persons` — `{ list: Person[] }` — persons with id, name, color, userId (linked Firebase Auth uid)
- `config/horses` — `{ list: Horse[] }` — horses with id, name, color, note, ownerPersonId
- `config/assignments_YYYY-WXX` — `{ map: { "Mån-morgon": personId, … } }` — one doc per ISO week
- `schedule/done_YYYY-WXX` — `{ map: { "Mån-morgon-horseId": bool } }` — feeding completions
- `schedule/swaps_YYYY-WXX` — `{ map: { "Mån-morgon": { fromPersonId, requestedAt } } }` — swap requests
- `push_subscriptions/{deviceId}` — `{ personId, subscription }` — Web Push subscriptions

**Key files:**
- `src/App.jsx` — all state, Firestore listeners, actions (assignPerson, requestSwap, etc.), identity/auth logic
- `src/constants.js` — THEMES, MEALS, DAYS, helpers (getWeekKey, getISOWeek), VAPID utils
- `src/firebase.js` — Firebase init, `db`, `auth`, `saveDoc`
- `src/views/WeekView.jsx` — week table + today summary + swap notifications
- `src/views/DayView.jsx` — meal cards per day with person picker and swap UI
- `src/views/HistoryView.jsx` — last 8 weeks read-only
- `src/views/PersonManager.jsx` / `HorseManager.jsx` — CRUD for persons and horses
- `functions/index.js` — 4 scheduled Cloud Functions (07:00, 12:00, 17:00, 20:30 Stockholm time) that send Web Push reminders. VAPID keys are stored as Firebase Secrets (`defineSecret`), accessed via `.value()` inside handlers.
- `public/sw.js` — Service Worker handling push events

## Identity model

Each Firebase Auth user can be linked to a person in the schedule via `person.userId`. On login, `App.jsx` auto-selects the linked person. If no link exists, an identity picker overlay appears. Selecting an identity in the overlay writes `userId` to the person doc and registers a Web Push subscription.

## Week keys

Weeks are stored with ISO week keys (`YYYY-WXX`). `getWeekKey(offset)` in `constants.js` returns the key for current week + offset. Week data (assignments, done, swaps) is loaded fresh whenever `weekOffset` changes.

## Deploy notes

- Frontend: containerized (multi-stage `Dockerfile` → nginx:alpine serving Vite `dist/`).
  - `docker-compose.yml` is the production stack; it joins the external `pantry_default` network so the Traefik instance in the `pantry` stack routes `stenstallet.backendboys.com` → container via labels.
  - `docker-compose.local.yml` exposes port 8080 directly for local testing (no Traefik).
  - Deploy = SSH to server, `git pull`, `docker compose up -d --build`. There is no GitHub Action auto-deploy.
- Firebase config is hardcoded in `src/firebase.js` (only public anon keys) — no build-time env vars needed.
- nginx config (`nginx.conf`): SPA fallback to `index.html`; immutable cache on `/assets/*`; no-cache on `index.html` and `/sw.js` so service worker updates propagate.
- Firebase project: `stenstallet-cdf6c` (us-central1)
- VAPID keys stored as Firebase Secrets, not env vars
