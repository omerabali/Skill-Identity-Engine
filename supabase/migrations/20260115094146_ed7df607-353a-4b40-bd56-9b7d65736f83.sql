-- Allow authenticated users to insert new skills (for custom skills)
CREATE POLICY "Authenticated users can insert skills" 
ON public.skills 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);