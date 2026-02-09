# AskAnAI (ASKANAI)

Anonymous-first polls and surveys with a hardened security model.

## Stack

- Frontend: Vite + React + TypeScript (`src/`)
- Backend: Vercel Serverless Functions (`api/`)
- Database/Auth/Storage: Supabase (`supabase/`)

## Quick Start (Local)

1. Install deps

```powershell
npm i
```

2. Set Vite env (public)

File: `.env`

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

3. Run locally

Recommended (serves both Vite + `api/`):

```powershell
vercel dev
```

Alternative (Vite only, without API):

```powershell
npm run dev
```

Note: critical writes are implemented in `/api`, so Vite-only mode is not representative of production security.

## Docs

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/API.md`
- `docs/DATABASE.md`
- `docs/DEPLOYMENT.md`
- `docs/DATA_MIGRATION.md`

## Supabase (Migrations)

```powershell
$env:SUPABASE_ACCESS_TOKEN="..."
supabase link --project-ref kevycqfdbmbvclqfccxt --yes
supabase db push --yes
```
