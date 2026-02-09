-- Archiving + reports backend support (v1)

-- Internal schema for archived data (not exposed to public clients)
CREATE SCHEMA IF NOT EXISTS internal;

REVOKE ALL ON SCHEMA internal FROM anon, authenticated;

-- Archive table for polls (metadata snapshot)
CREATE TABLE IF NOT EXISTS internal.polls_archive (
  archived_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  slug text,
  title text,
  description text,
  status public.poll_status,
  creator_key_hash text,
  created_by_user_id uuid,
  open_until timestamptz,
  close_after_responses integer,
  visibility_mode public.visibility_mode,
  allow_comments boolean,
  preview_image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by_user_id uuid,
  archived_ip_hash text,
  archived_reason text
);

CREATE INDEX IF NOT EXISTS polls_archive_poll_id_idx ON internal.polls_archive(poll_id);

-- Archive table for comments (snapshot)
CREATE TABLE IF NOT EXISTS internal.comments_archive (
  archived_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  poll_id uuid,
  display_name text,
  body text,
  fingerprint text,
  user_id uuid,
  status public.comment_status,
  created_at timestamptz,
  ip_hash text,
  user_agent_hash text,
  text_hash text,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by_user_id uuid,
  archived_ip_hash text,
  archived_reason text
);

CREATE INDEX IF NOT EXISTS comments_archive_comment_id_idx ON internal.comments_archive(comment_id);

-- SECURITY DEFINER archival function.
-- We revoke PUBLIC execute; only service_role should be able to call this via backend.
CREATE OR REPLACE FUNCTION public.archive_poll(
  _poll_id uuid,
  _actor_user_id uuid,
  _creator_key_hash text,
  _actor_ip_hash text,
  _reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal
AS $$
DECLARE
  p record;
  is_admin boolean := false;
BEGIN
  SELECT * INTO p FROM public.polls WHERE id = _poll_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF _actor_user_id IS NOT NULL THEN
    SELECT public.has_role(_actor_user_id, 'admin'::public.app_role) INTO is_admin;
  END IF;

  IF NOT (
    is_admin
    OR (_actor_user_id IS NOT NULL AND p.created_by_user_id = _actor_user_id)
    OR (_creator_key_hash IS NOT NULL AND p.creator_key_hash IS NOT NULL AND p.creator_key_hash = _creator_key_hash)
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO internal.polls_archive (
    poll_id, slug, title, description, status, creator_key_hash, created_by_user_id,
    open_until, close_after_responses, visibility_mode, allow_comments, preview_image_url,
    created_at, updated_at,
    archived_by_user_id, archived_ip_hash, archived_reason
  ) VALUES (
    p.id, p.slug, p.title, p.description, p.status, p.creator_key_hash, p.created_by_user_id,
    p.open_until, p.close_after_responses, p.visibility_mode, p.allow_comments, p.preview_image_url,
    p.created_at, p.updated_at,
    _actor_user_id, _actor_ip_hash, _reason
  );

  -- Cascade deletes questions/options/responses/answers/comments/poll_views via FKs.
  DELETE FROM public.polls WHERE id = _poll_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_poll(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_poll(uuid, uuid, text, text, text) TO service_role;

