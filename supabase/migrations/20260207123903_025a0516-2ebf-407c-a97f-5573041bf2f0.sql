-- Drop and recreate the INSERT policy with correct roles
DROP POLICY IF EXISTS "Anyone can submit responses" ON responses;

-- Create INSERT policy for anon and authenticated roles (not public)
CREATE POLICY "Anyone can submit responses" 
ON responses 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = responses.poll_id 
    AND polls.status = 'open'::poll_status
  )
);