-- Fix 1: Remove vulnerable poll UPDATE policy that allows anyone to update polls with creator_key_hash
DROP POLICY IF EXISTS "Creators can update their polls" ON public.polls;

-- Create secure policy: Only authenticated users can update their own polls
-- Anonymous poll updates must go through a secure edge function
CREATE POLICY "Authenticated creators can update their polls"
ON public.polls
FOR UPDATE
TO authenticated
USING (created_by_user_id = auth.uid());

-- Fix 2: Create a secure function for anonymous poll updates that verifies the key
CREATE OR REPLACE FUNCTION public.update_anonymous_poll(
  _poll_id uuid,
  _creator_key_hash text,
  _title text DEFAULT NULL,
  _description text DEFAULT NULL,
  _status poll_status DEFAULT NULL,
  _allow_comments boolean DEFAULT NULL,
  _visibility_mode visibility_mode DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Get the stored hash for this poll
  SELECT creator_key_hash INTO stored_hash
  FROM polls
  WHERE id = _poll_id;

  -- Verify the hash matches
  IF stored_hash IS NULL OR stored_hash != _creator_key_hash THEN
    RETURN false;
  END IF;

  -- Update only the fields that were provided
  UPDATE polls
  SET 
    title = COALESCE(_title, title),
    description = COALESCE(_description, description),
    status = COALESCE(_status, status),
    allow_comments = COALESCE(_allow_comments, allow_comments),
    visibility_mode = COALESCE(_visibility_mode, visibility_mode),
    updated_at = now()
  WHERE id = _poll_id;

  RETURN true;
END;
$$;