-- Add RLS policy for the view to allow poll owners and public visibility
CREATE POLICY "Poll owners can view responses via view"
ON public.responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = responses.poll_id
    AND (
      polls.visibility_mode = 'public'::visibility_mode
      OR polls.created_by_user_id = auth.uid()
      OR polls.creator_key_hash IS NOT NULL
    )
  )
);