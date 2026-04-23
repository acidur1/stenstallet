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

## Tech

- React 19 + Vite
- Firebase Firestore (realtidsdata) + Auth (e-post/lösenord)
- Firebase Cloud Functions (schemalagda push-notiser)
- Netlify (hosting)

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
