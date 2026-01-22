-- Fix pending_payments table - ensure only authenticated users can access their own payments
-- and prevent direct UPDATE (handled by verify_and_complete_payment function)

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own pending payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Users can create their own pending payments" ON public.pending_payments;

-- Recreate policies with explicit TO authenticated
CREATE POLICY "Users can view their own pending payments"
ON public.pending_payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending payments"
ON public.pending_payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy for users - status changes are handled by verify_and_complete_payment (SECURITY DEFINER)
-- No DELETE policy - payments should never be deleted

-- Verify that subscription_plans has correct protection (already has RLS enabled)
-- The existing "Anyone can view subscription plans" policy allows SELECT only
-- INSERT/UPDATE/DELETE are already blocked by not having any policies

-- Force RLS on pending_payments to ensure policies apply even to table owner
ALTER TABLE public.pending_payments FORCE ROW LEVEL SECURITY;