-- Drop existing policies for recettes
DROP POLICY IF EXISTS "Admin and Instructeur can create recettes" ON public.recettes;
DROP POLICY IF EXISTS "Admin and Instructeur can update recettes" ON public.recettes;
DROP POLICY IF EXISTS "Authenticated users can view recettes" ON public.recettes;
DROP POLICY IF EXISTS "Only admin can delete recettes" ON public.recettes;

-- Create new permissive RLS policies for recettes (security handled by edge function)
CREATE POLICY "Allow select recettes"
ON public.recettes
FOR SELECT
USING (true);

CREATE POLICY "Allow insert recettes"
ON public.recettes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update recettes"
ON public.recettes
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete recettes"
ON public.recettes
FOR DELETE
USING (true);

-- Drop existing policies for depenses
DROP POLICY IF EXISTS "Admin and Instructeur can create depenses" ON public.depenses;
DROP POLICY IF EXISTS "Admin and Instructeur can update depenses" ON public.depenses;
DROP POLICY IF EXISTS "Authenticated users can view depenses" ON public.depenses;
DROP POLICY IF EXISTS "Only admin can delete depenses" ON public.depenses;

-- Create new permissive RLS policies for depenses (security handled by edge function)
CREATE POLICY "Allow select depenses"
ON public.depenses
FOR SELECT
USING (true);

CREATE POLICY "Allow insert depenses"
ON public.depenses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update depenses"
ON public.depenses
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete depenses"
ON public.depenses
FOR DELETE
USING (true);