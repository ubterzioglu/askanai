-- Fix: responses_fingerprint_exposure
-- The policy "Poll owners can view responses via view" allows public access to fingerprints
-- when visibility_mode = 'public' or creator_key_hash IS NOT NULL (which is always true for anonymous polls)

-- Drop the overly permissive policy that exposes fingerprints
DROP POLICY IF EXISTS "Poll owners can view responses via view" ON public.responses;

-- The responses_public view (which excludes fingerprint) should be used instead
-- Users can still access response data via the view without seeing fingerprints
-- Admins retain full access via "Admins can view all responses" policy