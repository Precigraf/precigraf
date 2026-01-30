-- Fix 1: Add explicit policy to block anonymous access to users table
-- Drop existing SELECT policy on users table and recreate with explicit auth check
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix 2: Recreate the pending_payments_safe view with proper security
-- Drop and recreate the view with explicit security settings
DROP VIEW IF EXISTS public.pending_payments_safe;

CREATE VIEW public.pending_payments_safe
WITH (security_invoker = true, security_barrier = true)
AS
SELECT 
  id,
  user_id,
  created_at,
  expires_at,
  completed_at,
  status
FROM public.pending_payments
WHERE user_id = auth.uid();

-- Grant access to authenticated users only (revoke from anon/public)
REVOKE ALL ON public.pending_payments_safe FROM anon;
REVOKE ALL ON public.pending_payments_safe FROM public;
GRANT SELECT ON public.pending_payments_safe TO authenticated;

-- Also ensure the underlying pending_payments table has proper grants
REVOKE ALL ON public.pending_payments FROM anon;
REVOKE ALL ON public.pending_payments FROM public;

-- Revoke anon access from users table as well
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM public;