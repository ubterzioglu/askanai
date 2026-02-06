-- Create a secure view that excludes fingerprint data from comments
CREATE VIEW public.comments_public
WITH (security_invoker = on) AS
SELECT 
  id,
  poll_id,
  user_id,
  body,
  display_name,
  status,
  created_at
FROM public.comments;

-- Drop the existing public policy that exposes fingerprint
DROP POLICY IF EXISTS "Anyone can view visible comments" ON public.comments;

-- Create new policy for public access via view (without fingerprint)
CREATE POLICY "Public can view visible comments"
ON public.comments FOR SELECT
USING (status = 'visible'::comment_status);