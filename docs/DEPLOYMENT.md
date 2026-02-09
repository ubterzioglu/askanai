# Deployment

## Supabase

This repo contains Supabase migrations and an Edge Function.

### Link project

```powershell
$env:SUPABASE_ACCESS_TOKEN="..."
supabase link --project-ref kevycqfdbmbvclqfccxt --yes
```

### Push migrations

```powershell
supabase db push --yes
```

### Deploy Edge Functions

```powershell
supabase functions deploy send-confirmation-email --project-ref kevycqfdbmbvclqfccxt
```

### Function secrets

Set secrets (do not commit them):

```powershell
supabase secrets set --project-ref kevycqfdbmbvclqfccxt ALLOWED_ORIGINS="http://localhost:5173,https://your-domain"
```

## Vercel

### Environment variables (Server)

Set these in Vercel Project Settings (not in the client):

- `SUPABASE_URL` = `https://kevycqfdbmbvclqfccxt.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase service role key
- `IP_HASH_SALT` = random secret string
- `ALLOWED_ORIGINS` = comma-separated allowlist

### Environment variables (Client)

Vite uses:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

These are public values.

### Local dev

Recommended:

1. Run Vercel dev (serves `api/` and the Vite app)
2. Or run Vite and proxy `/api` to Vercel dev

Example:

```powershell
vercel dev
```

## Security headers

Configured in `vercel.json`.

