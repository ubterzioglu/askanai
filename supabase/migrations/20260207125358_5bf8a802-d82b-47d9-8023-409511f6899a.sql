-- Add back SELECT policy for public access to open polls
-- This is needed for INSERT operations to work (they need to read back the inserted row)
-- The polls_public view still hides creator_key_hash from the application layer
CREATE POLICY "Public can view open polls"
ON polls
FOR SELECT
TO anon, authenticated
USING (status IN ('open', 'closed'));