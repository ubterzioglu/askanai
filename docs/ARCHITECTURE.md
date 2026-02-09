# Architecture

## Components

- Frontend: Vite + React (`src/`)
- Backend API: Vercel Serverless Functions (`api/`)
- Database/Auth/Storage: Supabase (Postgres + RLS, Auth, Storage) (`supabase/`)

## High-Level Data Flow

- Public reads:
  - Frontend reads only from *public views* (`polls_public`, `comments_public`) and from non-sensitive tables (`questions`, `options`) governed by RLS.
- Critical writes:
  - Frontend calls `POST /api/...` endpoints.
  - API uses Supabase `service_role` to run privileged DB writes and to enforce:
    - rate limiting
    - duplicate prevention
    - give-to-get gating (for `visibility_mode = voters`)
    - ownership checks (creator key or authenticated owner)

## Why This Split Exists

The client is assumed to be fully untrusted (requests can be replayed/manipulated). Therefore:

- Business rules are not enforced in the browser.
- Database is protected by:
  - RLS policies
  - column-level `REVOKE SELECT` for sensitive fields
  - public views that *omit* sensitive fields

The API layer exists so that even if a user connects directly to Supabase using the public key, they cannot perform critical operations.

