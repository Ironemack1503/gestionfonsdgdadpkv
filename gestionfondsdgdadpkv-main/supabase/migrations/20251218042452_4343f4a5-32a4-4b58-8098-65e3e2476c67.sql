-- Enable realtime for rubriques table
ALTER TABLE public.rubriques REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rubriques;

-- Enable realtime for feuilles_caisse table
ALTER TABLE public.feuilles_caisse REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feuilles_caisse;