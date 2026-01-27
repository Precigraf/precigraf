-- =====================================================
-- FIX: Use security_invoker instead of security_definer
-- This ensures the view runs with the permissions of the querying user
-- =====================================================

-- Drop and recreate view with security_invoker (correct approach)
DROP VIEW IF EXISTS public.pending_payments_safe;

CREATE VIEW public.pending_payments_safe 
WITH (security_barrier = true, security_invoker = true) AS
SELECT 
  id,
  user_id,
  status,
  created_at,
  expires_at,
  completed_at
FROM public.pending_payments
WHERE user_id = auth.uid();

-- Grant SELECT only to authenticated users
REVOKE ALL ON public.pending_payments_safe FROM anon;
REVOKE ALL ON public.pending_payments_safe FROM public;
GRANT SELECT ON public.pending_payments_safe TO authenticated;

-- Add comment documenting the security design
COMMENT ON VIEW public.pending_payments_safe IS 'Secure view of pending_payments that hides csrf_token and filters by authenticated user. Uses security_invoker=true so queries run with user permissions.';