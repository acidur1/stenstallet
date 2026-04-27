# Stenstallet

Fodringsschema-app för stallet. Håller koll på vem som ansvarar för morgon, lunch, middag och kväll — varje dag, varje vecka.

## Funktioner

- Veckoschema med personliga fodringspass (upp till 4 veckor framåt)
- Dagvy med möjlighet att byta ansvarig
- Bytesförfrågningar — be någon ta över ditt pass
- Historik över tidigare veckor
- Push-notiser när det är dags att fodra
- **Whiteboard-synk** — ta en bild på den handskrivna tavlan och synka schemat automatiskt med AI (Gemini Vision). Stöder lunch/middag-tavlan (2×2-rutnät) och morgon/kväll-tavlan (vertikal kolumn). Löser även upp box-nummer till rätt ägare
- Mörkt/ljust tema (sparas per enhet)
- PWA — kan installeras på hemskärmen

## Stack

| Lager | Teknik |
|---|---|
| Språk | JavaScript (JSX) |
| Frontend | React 19 |
| Bundler | Vite 8 |
| Databas | Firebase Firestore (realtid) |
| Auth | Firebase Authentication (e-post/lösenord) |
| Backend | Firebase Cloud Functions (Node.js) |
| AI | Google Gemini Vision API (whiteboard-tolkning) |
| Push | Web Push API med VAPID-nycklar |
| PWA | Service Worker + Web App Manifest |
| Hosting | backendboys.com (via GitHub auto-deploy) |

## Projektstruktur

```
src/
  App.jsx           # Huvudkomponent, state och actions
  firebase.js       # Firebase-konfiguration
  constants.js      # Konstanter, teman, hjälpfunktioner
  AuthScreen.jsx    # Inloggningsskärm
  views/
    WeekView.jsx    # Veckovy med schema-tabell
    DayView.jsx     # Dagvy med fodringspass och byten
    HistoryView.jsx # Historik över tidigare veckor
    PersonManager.jsx
    HorseManager.jsx
    WhiteboardSync.jsx  # Whiteboard-synk med Gemini Vision
functions/
  index.js          # Push-notiser (schemalagda) + parseWhiteboard (HTTP)
public/
  sw.js             # Service Worker för push-notiser
  manifest.json     # PWA-manifest
```

## Lokal utveckling

```bash
npm install
npm run dev
```

## Deploy

```bash
git push
```

Firebase Functions:
```bash
firebase deploy --only functions
```
