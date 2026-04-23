# Stenstallet

Fodringsschema-app för stallet. Håller koll på vem som ansvarar för morgon, lunch, middag och kväll — varje dag, varje vecka.

## Funktioner

- Veckoschema med personliga fodringspass
- Dagvy med möjlighet att byta ansvarig
- Bytesförfrågningar — be någon ta över ditt pass
- Historik över tidigare veckor
- Push-notiser när det är dags att fodra
- Mörkt/ljust tema
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
| Push | Web Push API med VAPID-nycklar |
| PWA | Service Worker + Web App Manifest |
| Hosting | Netlify |

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
functions/
  index.js          # Schemalagda Cloud Functions för push-notiser
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
npm run build
netlify deploy --prod --dir=dist
```

Firebase Functions:
```bash
firebase deploy --only functions
```
