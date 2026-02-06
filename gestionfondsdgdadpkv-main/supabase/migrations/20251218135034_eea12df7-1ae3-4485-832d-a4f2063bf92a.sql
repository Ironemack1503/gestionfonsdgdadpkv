-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can create programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin can update programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin can delete programmations" ON public.programmations;

-- Create new policies allowing both admin and instructeur
CREATE POLICY "Admin and Instructeur can create programmations" 
ON public.programmations 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin and Instructeur can update programmations" 
ON public.programmations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin and Instructeur can delete programmations" 
ON public.programmations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));