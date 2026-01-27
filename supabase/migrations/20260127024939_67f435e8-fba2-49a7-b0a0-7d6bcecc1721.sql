-- =====================================================
-- SECURITY FIX: Enable RLS on pending_payments_safe view
-- Users can only see their own payment records
-- =====================================================

-- Enable RLS on the view
ALTER VIEW public.pending_payments_safe SET (security_invoker = true);

-- Enable RLS on pending_payments_safe (views support RLS in PostgreSQL 15+)
-- For compatibility, we'll use security_barrier and recreate with proper access

-- Drop and recreate view with security_barrier for defense in depth
DROP VIEW IF EXISTS public.pending_payments_safe;

CREATE VIEW public.pending_payments_safe 
WITH (security_barrier = true) AS
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
COMMENT ON VIEW public.pending_payments_safe IS 'Secure view of pending_payments that hides csrf_token and filters by authenticated user. Uses security_barrier and WHERE clause for row-level filtering.';