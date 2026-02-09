-- Security hardening v1
-- Goals:
-- - Client is untrusted: critical writes go through backend (Vercel /api) using service role.
-- - Public DTOs must never expose: user_id, ip_hash, fingerprints, abuse signals, archived data.
-- - Enforce privacy by:
--   - dropping permissive INSERT policies
--   - adding column-level SELECT revokes for sensitive columns
--   - using public views that exclude sensitive columns

-- ---------------------------------------------------------------------
-- 1) Add internal-only columns used by backend enforcement
-- ---------------------------------------------------------------------

-- Responses: store backend-derived ip/user-agent hashes for abuse + dedupe.
ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS user_agent_hash text;

-- Comments: store internal ip hash and text hash for duplicate detection.
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS user_agent_hash text,
  ADD COLUMN IF NOT EXISTS text_hash text;

-- Tickets (reports): store internal ip hash and text hash for throttling/duplicates.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS user_agent_hash text,
  ADD COLUMN IF NOT EXISTS text_hash text;

-- Poll views: store backend-derived ip hash. (fingerprint is legacy; keep for now)
ALTER TABLE public.poll_views
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS user_agent_hash text;

-- ---------------------------------------------------------------------
-- 2) Uniqueness / dedupe constraints (DB-level)
-- ---------------------------------------------------------------------

-- One response per poll per authenticated user.
CREATE UNIQUE INDEX IF NOT EXISTS responses_unique_poll_user
  ON public.responses (poll_id, user_id)
  WHERE user_id IS NOT NULL;

-- One response per poll per anonymous ip_hash (backend provided).
CREATE UNIQUE INDEX IF NOT EXISTS responses_unique_poll_ip_anon
  ON public.responses (poll_id, ip_hash)
  WHERE user_id IS NULL AND ip_hash IS NOT NULL;

-- One answer per question per response.
CREATE UNIQUE INDEX IF NOT EXISTS answers_unique_response_question
  ON public.answers (response_id, question_id);

-- Duplicate comment protection: same text from same ip on same poll.
CREATE UNIQUE INDEX IF NOT EXISTS comments_unique_poll_ip_text
  ON public.comments (poll_id, ip_hash, text_hash)
  WHERE ip_hash IS NOT NULL AND text_hash IS NOT NULL;

-- Duplicate ticket protection: same text from same ip on same poll/comment.
CREATE UNIQUE INDEX IF NOT EXISTS tickets_unique_target_ip_text
  ON public.tickets (poll_id, comment_id, ip_hash, text_hash)
  WHERE ip_hash IS NOT NULL AND text_hash IS NOT NULL;

-- Poll view uniqueness: one view per poll per ip_hash.
CREATE UNIQUE INDEX IF NOT EXISTS poll_views_unique_poll_ip
  ON public.poll_views (poll_id, ip_hash)
  WHERE ip_hash IS NOT NULL;

-- ---------------------------------------------------------------------
-- 3) Abuse tracking table (backend will record events and enforce windows)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.abuse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS abuse_events_type_ip_created_at
  ON public.abuse_events (event_type, ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS abuse_events_type_user_created_at
  ON public.abuse_events (event_type, user_id, created_at DESC);

ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;

-- No public read/write. Backend uses service role (bypasses RLS).
-- Keep an explicit deny policy to avoid accidental exposure.
DROP POLICY IF EXISTS "No public abuse events" ON public.abuse_events;
CREATE POLICY "No public abuse events"
ON public.abuse_events
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ---------------------------------------------------------------------
-- 4) Public views: exclude sensitive fields by design
-- ---------------------------------------------------------------------

-- Note: we DROP + CREATE because CREATE OR REPLACE VIEW cannot remove columns.
DROP VIEW IF EXISTS public.polls_public;
DROP VIEW IF EXISTS public.responses_public;
DROP VIEW IF EXISTS public.comments_public;

-- Polls public view: MUST NOT include creator_key_hash or created_by_user_id
CREATE VIEW public.polls_public
WITH (security_invoker=on) AS
  SELECT
    id,
    slug,
    title,
    description,
    status,
    open_until,
    close_after_responses,
    visibility_mode,
    allow_comments,
    preview_image_url,
    created_at,
    updated_at
  FROM public.polls;

-- Responses public view: keep minimal, and exclude user_id / fingerprint / ip_hash
CREATE VIEW public.responses_public
WITH (security_invoker=on) AS
  SELECT
    id,
    poll_id,
    respondent_name,
    created_at
  FROM public.responses;

-- Comments public view: only visible comments, no user_id/fingerprint/ip_hash
CREATE VIEW public.comments_public
WITH (security_invoker=on) AS
  SELECT
    id,
    poll_id,
    display_name,
    body,
    created_at
  FROM public.comments
  WHERE status = 'visible'::public.comment_status;

GRANT SELECT ON public.polls_public TO anon, authenticated;
GRANT SELECT ON public.comments_public TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) Column-level privacy: prevent direct selection of sensitive fields
-- ---------------------------------------------------------------------

-- Even if a SELECT policy accidentally becomes permissive later,
-- column revokes prevent leaking identifiers/hashes via direct table access.
REVOKE SELECT (creator_key_hash, created_by_user_id) ON public.polls FROM anon, authenticated;
REVOKE SELECT (fingerprint, user_id, ip_hash, user_agent_hash) ON public.responses FROM anon, authenticated;
REVOKE SELECT (fingerprint, user_id, ip_hash, user_agent_hash, text_hash) ON public.comments FROM anon, authenticated;
REVOKE SELECT (ip_hash, user_agent_hash, text_hash) ON public.tickets FROM anon, authenticated;
REVOKE SELECT (fingerprint, ip_hash, user_agent_hash) ON public.poll_views FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- 6) RLS policy hardening: remove permissive client-write paths
-- ---------------------------------------------------------------------

-- Polls: allow public read for non-private polls only (writes via backend).
DROP POLICY IF EXISTS "Anyone can view open polls" ON public.polls;
DROP POLICY IF EXISTS "Direct polls access for admins only" ON public.polls;

CREATE POLICY "Public can view non-private polls"
ON public.polls
FOR SELECT
TO anon, authenticated
USING (
  status IN ('open', 'closed')
  AND visibility_mode IN ('public', 'unlisted', 'voters')
);

-- Keep admin SELECT policy from earlier migrations (if present).

-- Questions/options: only if parent poll is publicly accessible (or admin/owner).
DROP POLICY IF EXISTS "Anyone can view questions of visible polls" ON public.questions;
CREATE POLICY "Public can view questions of accessible polls"
ON public.questions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.polls p
    WHERE p.id = questions.poll_id
      AND p.status IN ('open', 'closed')
      AND p.visibility_mode IN ('public', 'unlisted', 'voters')
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.polls p
    WHERE p.id = questions.poll_id
      AND p.created_by_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can view options" ON public.options;
CREATE POLICY "Public can view options of accessible polls"
ON public.options
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.polls p ON p.id = q.poll_id
    WHERE q.id = options.question_id
      AND p.status IN ('open', 'closed')
      AND p.visibility_mode IN ('public', 'unlisted', 'voters')
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.polls p ON p.id = q.poll_id
    WHERE q.id = options.question_id
      AND p.created_by_user_id = auth.uid()
  )
);

-- Block direct client inserts for critical tables (backend enforces rate limit/give-to-get/ownership).
DROP POLICY IF EXISTS "Authenticated users can create polls" ON public.polls;
DROP POLICY IF EXISTS "Anonymous poll creation with key" ON public.polls;
DROP POLICY IF EXISTS "Authenticated creators can update their polls" ON public.polls;
DROP POLICY IF EXISTS "Creators can update their polls" ON public.polls;

DROP POLICY IF EXISTS "Poll owners can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Poll owners can manage options" ON public.options;

DROP POLICY IF EXISTS "Anyone can submit responses" ON public.responses;
DROP POLICY IF EXISTS "Anyone can submit answers to open polls" ON public.answers;
DROP POLICY IF EXISTS "Anyone can add comments to open polls" ON public.comments;
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anyone can record poll views" ON public.poll_views;

-- Responses/answers are admin-only readable.
DROP POLICY IF EXISTS "Direct access restricted to admins" ON public.responses;
CREATE POLICY "Responses readable by admins only"
ON public.responses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Visible based on poll visibility" ON public.answers;
CREATE POLICY "Answers readable by admins only"
ON public.answers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Comments: public can SELECT visible (already exists). Keep admin policies.
-- Ensure there is no public INSERT policy (backend only).

-- Tickets: admin only (existing policies already enforce).

-- Poll views: admin only readable.
DROP POLICY IF EXISTS "Poll owners can view their poll views" ON public.poll_views;
CREATE POLICY "Poll views readable by admins only"
ON public.poll_views
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------------------------------------------------------------------
-- 7) Storage hardening (poll preview images)
-- ---------------------------------------------------------------------

-- Keep public reads (preview images can be public).
-- Prevent anonymous uploads; use backend to generate signed uploads if needed.
DROP POLICY IF EXISTS "Anyone can upload poll images" ON storage.objects;
CREATE POLICY "Authenticated can upload poll images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'poll-images');
