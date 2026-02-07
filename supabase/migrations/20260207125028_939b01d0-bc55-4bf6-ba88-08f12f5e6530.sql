-- Create a public view for polls that excludes sensitive creator_key_hash
CREATE VIEW public.polls_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    slug,
    title,
    description,
    status,
    created_by_user_id,
    open_until,
    close_after_responses,
    visibility_mode,
    allow_comments,
    preview_image_url,
    created_at,
    updated_at
  FROM public.polls;
-- Excludes creator_key_hash for security

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.polls_public TO anon;
GRANT SELECT ON public.polls_public TO authenticated;

-- Drop existing public SELECT policies on polls table
DROP POLICY IF EXISTS "Anyone can view open polls" ON polls;

-- Create restrictive SELECT policy - only admins and owners can directly access polls table
CREATE POLICY "Direct polls access for admins only"
ON polls
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR created_by_user_id = auth.uid()
);

-- Keep the admin policy (already exists, but ensure it's there)
-- Admins can view all polls is already covered by has_role check above