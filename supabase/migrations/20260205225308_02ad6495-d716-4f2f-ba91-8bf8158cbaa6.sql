-- Fix the tickets INSERT policy to be more constrained
-- Users can only create tickets about polls or comments that exist

DROP POLICY IF EXISTS "Anyone can create tickets" ON public.tickets;

CREATE POLICY "Users can create tickets about existing content"
ON public.tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Must reference a valid poll OR comment, and type must be set
  type IS NOT NULL AND (
    (poll_id IS NOT NULL AND EXISTS (SELECT 1 FROM polls WHERE id = tickets.poll_id)) OR
    (comment_id IS NOT NULL AND EXISTS (SELECT 1 FROM comments WHERE id = tickets.comment_id)) OR
    (poll_id IS NULL AND comment_id IS NULL) -- General feedback allowed
  )
);