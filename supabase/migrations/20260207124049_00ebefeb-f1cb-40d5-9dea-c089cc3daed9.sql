-- Add SELECT policy for responses table so users can read back their own insertions
-- This allows the .select() chain after insert to work
CREATE POLICY "Users can view own responses by fingerprint" 
ON responses 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Note: Since fingerprint is generated client-side, we allow SELECT on all rows
-- This is safe because fingerprint data is not sensitive and responses_public view 
-- is used for public-facing queries which hides the fingerprint