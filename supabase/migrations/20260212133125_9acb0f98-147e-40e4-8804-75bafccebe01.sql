
-- Block all UPDATE and DELETE on pending_payments explicitly
CREATE POLICY "No direct update to pending_payments"
ON public.pending_payments
FOR UPDATE
USING (false);

CREATE POLICY "No direct delete from pending_payments"
ON public.pending_payments
FOR DELETE
USING (false);
