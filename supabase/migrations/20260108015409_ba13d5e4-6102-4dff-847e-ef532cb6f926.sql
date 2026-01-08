-- Add UPDATE policy for calculations table
CREATE POLICY "Users can update their own calculations"
ON public.calculations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);