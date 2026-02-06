-- Enable realtime for recettes table
ALTER TABLE public.recettes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recettes;

-- Enable realtime for depenses table
ALTER TABLE public.depenses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.depenses;