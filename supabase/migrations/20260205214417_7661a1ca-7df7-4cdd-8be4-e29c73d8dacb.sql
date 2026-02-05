-- ASKANAI Database Schema
-- Polls and surveys platform

-- Enum for question types
CREATE TYPE public.question_type AS ENUM (
  'single_choice',
  'multiple_choice',
  'rating',
  'nps',
  'ranking',
  'short_text',
  'emoji'
);

-- Enum for poll visibility
CREATE TYPE public.visibility_mode AS ENUM (
  'public',
  'unlisted',
  'voters',
  'private'
);

-- Enum for poll status
CREATE TYPE public.poll_status AS ENUM (
  'draft',
  'open',
  'closed'
);

-- Enum for comment status
CREATE TYPE public.comment_status AS ENUM (
  'visible',
  'hidden',
  'flagged'
);

-- Polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status poll_status NOT NULL DEFAULT 'open',
  creator_key_hash TEXT, -- hashed key for anonymous creators
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  open_until TIMESTAMPTZ,
  close_after_responses INTEGER,
  visibility_mode visibility_mode NOT NULL DEFAULT 'public',
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  type question_type NOT NULL DEFAULT 'single_choice',
  prompt TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Options for choice-based questions
CREATE TABLE public.options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Response sessions (one per respondent per poll)
CREATE TABLE public.responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  respondent_name TEXT,
  fingerprint TEXT, -- browser fingerprint for anti-spam
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual answers
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  value_text TEXT, -- for text answers
  value_number INTEGER, -- for numeric answers (rating, nps)
  value_json JSONB, -- for complex answers (multiple choice, ranking)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comments on polls
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  display_name TEXT,
  body TEXT NOT NULL,
  fingerprint TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status comment_status NOT NULL DEFAULT 'visible',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets for moderation/reports
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_polls_slug ON public.polls(slug);
CREATE INDEX idx_polls_status ON public.polls(status);
CREATE INDEX idx_questions_poll_id ON public.questions(poll_id);
CREATE INDEX idx_options_question_id ON public.options(question_id);
CREATE INDEX idx_responses_poll_id ON public.responses(poll_id);
CREATE INDEX idx_responses_fingerprint ON public.responses(fingerprint);
CREATE INDEX idx_answers_response_id ON public.answers(response_id);
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
CREATE INDEX idx_comments_poll_id ON public.comments(poll_id);
CREATE INDEX idx_comments_status ON public.comments(status);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls (public read for open polls)
CREATE POLICY "Anyone can view open polls"
  ON public.polls FOR SELECT
  USING (status IN ('open', 'closed'));

CREATE POLICY "Authenticated users can create polls"
  ON public.polls FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous poll creation via API only"
  ON public.polls FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Creators can update their polls"
  ON public.polls FOR UPDATE
  USING (created_by_user_id = auth.uid() OR creator_key_hash IS NOT NULL);

-- RLS for questions
CREATE POLICY "Anyone can view questions of visible polls"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = questions.poll_id 
      AND polls.status IN ('open', 'closed')
    )
  );

CREATE POLICY "Poll owners can manage questions"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = questions.poll_id 
      AND (polls.created_by_user_id = auth.uid() OR polls.creator_key_hash IS NOT NULL)
    )
  );

-- RLS for options
CREATE POLICY "Anyone can view options"
  ON public.options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.polls p ON p.id = q.poll_id
      WHERE q.id = options.question_id
      AND p.status IN ('open', 'closed')
    )
  );

CREATE POLICY "Poll owners can manage options"
  ON public.options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.polls p ON p.id = q.poll_id
      WHERE q.id = options.question_id
      AND (p.created_by_user_id = auth.uid() OR p.creator_key_hash IS NOT NULL)
    )
  );

-- RLS for responses (anyone can submit)
CREATE POLICY "Anyone can submit responses"
  ON public.responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = responses.poll_id 
      AND polls.status = 'open'
    )
  );

CREATE POLICY "Poll owners can view responses"
  ON public.responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = responses.poll_id 
      AND (
        polls.visibility_mode = 'public' OR
        polls.created_by_user_id = auth.uid() OR
        polls.creator_key_hash IS NOT NULL
      )
    )
  );

-- RLS for answers
CREATE POLICY "Anyone can submit answers"
  ON public.answers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Visible based on poll visibility"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.responses r
      JOIN public.polls p ON p.id = r.poll_id
      WHERE r.id = answers.response_id
      AND (
        p.visibility_mode = 'public' OR
        p.created_by_user_id = auth.uid()
      )
    )
  );

-- RLS for comments
CREATE POLICY "Anyone can view visible comments"
  ON public.comments FOR SELECT
  USING (status = 'visible');

CREATE POLICY "Anyone can add comments to open polls"
  ON public.comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = comments.poll_id 
      AND polls.allow_comments = true
      AND polls.status = 'open'
    )
  );

-- RLS for tickets (admin only via service role)
CREATE POLICY "Service role manages tickets"
  ON public.tickets FOR ALL
  TO service_role
  USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate short slug
CREATE OR REPLACE FUNCTION public.generate_poll_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;