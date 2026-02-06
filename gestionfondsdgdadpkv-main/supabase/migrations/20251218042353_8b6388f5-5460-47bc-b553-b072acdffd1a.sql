-- Enable realtime for programmations table
ALTER TABLE public.programmations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.programmations;