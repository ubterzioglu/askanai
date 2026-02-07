-- Drop the existing restrictive INSERT policy on responses
DROP POLICY IF EXISTS "Anyone can submit responses" ON responses;

-- Create a new PERMISSIVE INSERT policy for responses
CREATE POLICY "Anyone can submit responses" 
ON responses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = responses.poll_id 
    AND polls.status = 'open'::poll_status
  )
);