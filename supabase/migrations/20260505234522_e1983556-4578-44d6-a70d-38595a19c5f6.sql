CREATE POLICY "Users can delete own tickets"
ON public.support_tickets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);