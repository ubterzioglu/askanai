-- Create table to track unique poll views
CREATE TABLE public.poll_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, fingerprint)
);

-- Enable RLS
ALTER TABLE public.poll_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (for tracking)
CREATE POLICY "Anyone can record poll views"
ON public.poll_views
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = poll_views.poll_id
    AND polls.status IN ('open', 'closed')
  )
);

-- Poll owners and admins can view stats
CREATE POLICY "Poll owners can view their poll views"
ON public.poll_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = poll_views.poll_id
    AND (
      polls.visibility_mode = 'public'
      OR polls.created_by_user_id = auth.uid()
    )
  )
  OR has_role(auth.uid(), 'admin')
);

-- Create index for faster queries
CREATE INDEX idx_poll_views_poll_id ON public.poll_views(poll_id);