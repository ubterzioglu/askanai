-- Ensure RLS is enabled but allow inserts
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Grant all necessary permissions explicitly
GRANT ALL ON public.responses TO anon;
GRANT ALL ON public.responses TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;