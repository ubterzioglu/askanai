-- Grant INSERT permission on responses table to anon and authenticated roles
GRANT INSERT ON public.responses TO anon;
GRANT INSERT ON public.responses TO authenticated;

-- Also grant SELECT on responses_public view
GRANT SELECT ON public.responses_public TO anon;
GRANT SELECT ON public.responses_public TO authenticated;

-- Grant INSERT on answers table
GRANT INSERT ON public.answers TO anon;
GRANT INSERT ON public.answers TO authenticated;