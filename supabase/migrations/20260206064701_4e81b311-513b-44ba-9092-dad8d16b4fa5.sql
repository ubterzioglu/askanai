-- Create a secure view that excludes fingerprint data
CREATE VIEW public.responses_public
WITH (security_invoker = on) AS
SELECT 
  id,
  poll_id,
  user_id,
  respondent_name,
  created_at
FROM public.responses;

-- Drop the existing policy that exposes fingerprint data
DROP POLICY IF EXISTS "Poll owners can view responses" ON public.responses;

-- Create a new restrictive policy - only admins can see fingerprints directly
-- Poll owners and public can only access via the view
CREATE POLICY "Direct access restricted to admins"
ON public.responses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));