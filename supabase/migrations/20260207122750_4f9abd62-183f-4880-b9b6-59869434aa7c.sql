-- Drop ALL existing policies on responses table and recreate properly
DROP POLICY IF EXISTS "Admins can view all responses" ON responses;
DROP POLICY IF EXISTS "Direct access restricted to admins" ON responses;
DROP POLICY IF EXISTS "Anyone can submit responses" ON responses;

-- Recreate SELECT policy for admins (PERMISSIVE by default)
CREATE POLICY "Admins can view all responses" 
ON responses 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create PERMISSIVE INSERT policy for public response submissions
CREATE POLICY "Anyone can submit responses" 
ON responses 
FOR INSERT 
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = responses.poll_id 
    AND polls.status = 'open'::poll_status
  )
);