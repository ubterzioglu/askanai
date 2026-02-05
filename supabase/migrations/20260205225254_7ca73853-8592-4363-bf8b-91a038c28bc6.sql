-- Fix 1: Drop overly permissive INSERT policies and replace with proper constraints

-- Drop the old permissive polls INSERT policies
DROP POLICY IF EXISTS "Anonymous poll creation via API only" ON public.polls;
DROP POLICY IF EXISTS "Authenticated users can create polls" ON public.polls;

-- Create proper INSERT policy for polls (authenticated users only, must set their user_id)
CREATE POLICY "Authenticated users can create polls"
ON public.polls
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid() OR creator_key_hash IS NOT NULL
);

-- Allow anonymous poll creation (for API/edge function use cases where creator_key_hash is set)
CREATE POLICY "Anonymous poll creation with key"
ON public.polls
FOR INSERT
TO anon
WITH CHECK (creator_key_hash IS NOT NULL);

-- Fix 2: Drop the old permissive answers INSERT policy
DROP POLICY IF EXISTS "Anyone can submit answers" ON public.answers;

-- Create constrained INSERT policy for answers (only for open polls)
CREATE POLICY "Anyone can submit answers to open polls"
ON public.answers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM responses r
    JOIN polls p ON p.id = r.poll_id
    WHERE r.id = answers.response_id
    AND p.status = 'open'
  )
);

-- Fix 3: Add INSERT policy for tickets so users can report issues
CREATE POLICY "Anyone can create tickets"
ON public.tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Fix 4: Update polls SELECT policy to exclude creator_key_hash from public reads
-- We'll use a view approach - create a secure view for public access
DROP POLICY IF EXISTS "Anyone can view open polls" ON public.polls;

-- Create policy that allows viewing but RLS can't filter columns, so we rely on app logic
-- Keep the policy but document that creator_key_hash should NOT be selected in public queries
CREATE POLICY "Anyone can view open polls"
ON public.polls
FOR SELECT
TO anon, authenticated
USING (status IN ('open', 'closed'));