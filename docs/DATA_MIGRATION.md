# Data Migration (Existing Production Data)

This repo can reliably reproduce **schema** from migrations. Copying **existing rows** from another Supabase project requires access to the *source* database.

## What Was Done

- Destination project ref: `kevycqfdbmbvclqfccxt`
- Schema was pushed via `supabase db push` (migrations).

## If You Need to Copy Data From Another Project

You need **one** of:

- Supabase access token that has access to the source project, or
- the source Postgres password/connection string.

### Steps (CLI-driven, recommended)

1. Link the source project:

```powershell
$env:SUPABASE_ACCESS_TOKEN="..."
supabase link --project-ref <SOURCE_PROJECT_REF> --yes
```

2. Dump schema + data (or data-only):

```powershell
supabase db dump --file ./.tmp/source.sql --use-copy
# or:
supabase db dump --data-only --file ./.tmp/source-data.sql --use-copy
```

3. Link the destination project:

```powershell
supabase link --project-ref kevycqfdbmbvclqfccxt --yes
```

4. Restore into destination

Use `psql` with destination connection string (from Supabase dashboard -> Database -> Connection string):

```powershell
psql "<DEST_POSTGRES_URL>" -f ./.tmp/source.sql
```

Notes:

- If your destination already has schema from migrations, restore **data-only**.
- Validate constraints (unique indexes, RLS) after restore.

