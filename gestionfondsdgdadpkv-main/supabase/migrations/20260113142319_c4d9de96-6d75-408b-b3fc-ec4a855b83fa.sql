-- Drop existing policies for rubriques
DROP POLICY IF EXISTS "Admin can delete rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Admin can insert rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Admin can update rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Authenticated users can view rubriques" ON public.rubriques;

-- Create new permissive RLS policies for rubriques (security handled by edge function)
CREATE POLICY "Allow select rubriques"
ON public.rubriques
FOR SELECT
USING (true);

CREATE POLICY "Allow insert rubriques"
ON public.rubriques
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update rubriques"
ON public.rubriques
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete rubriques"
ON public.rubriques
FOR DELETE
USING (true);

-- Drop existing policies for feuilles_caisse
DROP POLICY IF EXISTS "Admin and Instructeur can create feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Admin and Instructeur can update feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Authenticated users can view feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Only admin can delete feuilles_caisse" ON public.feuilles_caisse;

-- Create new permissive RLS policies for feuilles_caisse (security handled by edge function)
CREATE POLICY "Allow select feuilles_caisse"
ON public.feuilles_caisse
FOR SELECT
USING (true);

CREATE POLICY "Allow insert feuilles_caisse"
ON public.feuilles_caisse
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update feuilles_caisse"
ON public.feuilles_caisse
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete feuilles_caisse"
ON public.feuilles_caisse
FOR DELETE
USING (true);