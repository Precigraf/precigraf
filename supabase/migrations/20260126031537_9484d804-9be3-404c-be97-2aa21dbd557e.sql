-- Create a secure view that excludes the csrf_token column
CREATE VIEW public.pending_payments_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  status,
  created_at,
  expires_at,
  completed_at
FROM public.pending_payments;

-- Comment explaining the view purpose
COMMENT ON VIEW public.pending_payments_safe IS 'Secure view that hides CSRF tokens from client access';

-- Drop the existing SELECT policy on the base table
DROP POLICY IF EXISTS "Users can view their own pending payments" ON public.pending_payments;

-- Create a restrictive SELECT policy that denies direct access to base table
-- The SECURITY DEFINER function verify_and_complete_payment bypasses RLS
CREATE POLICY "No direct SELECT access to pending_payments"
ON public.pending_payments
FOR SELECT
TO authenticated
USING (false);

-- Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.pending_payments_safe TO authenticated;

-- Revoke any remaining access from anon role
REVOKE ALL ON public.pending_payments FROM anon;
REVOKE ALL ON public.pending_payments_safe FROM anon;