-- Refresh PostgREST schema cache so new columns are visible
NOTIFY pgrst, 'reload schema';
