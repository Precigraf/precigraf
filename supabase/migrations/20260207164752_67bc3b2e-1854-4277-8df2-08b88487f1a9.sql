-- Security hardening for device_fingerprints table and pending_payments_safe view
-- Addressing error-level findings: device_fingerprints_tracking_exposure, pending_payments_safe_no_policies

-- 1. DEVICE_FINGERPRINTS TABLE: Apply FORCE RLS and revoke anonymous access
ALTER TABLE public.device_fingerprints FORCE ROW LEVEL SECURITY;

-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.device_fingerprints FROM anon;
REVOKE ALL ON public.device_fingerprints FROM public;

-- 2. PENDING_PAYMENTS_SAFE VIEW: This is a security view that intentionally hides sensitive fields (csrf_token, payment_provider_id)
-- The view already exists but needs proper SECURITY INVOKER setting to respect RLS of underlying table
-- Drop and recreate the view with SECURITY INVOKER

DROP VIEW IF EXISTS public.pending_payments_safe;

CREATE VIEW public.pending_payments_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  created_at,
  expires_at,
  completed_at,
  status
FROM public.pending_payments
WHERE user_id = auth.uid();

-- Grant minimal permissions - only authenticated users can SELECT from the safe view
GRANT SELECT ON public.pending_payments_safe TO authenticated;

-- Explicitly revoke from anon and public
REVOKE ALL ON public.pending_payments_safe FROM anon;
REVOKE ALL ON public.pending_payments_safe FROM public;

-- Log security hardening action
INSERT INTO public.security_logs (event_type, event_description, metadata)
VALUES (
  'security_hardening', 
  'Applied FORCE RLS on device_fingerprints and recreated pending_payments_safe view with security_invoker',
  '{"tables": ["device_fingerprints"], "views": ["pending_payments_safe"], "actions": ["FORCE ROW LEVEL SECURITY", "SECURITY INVOKER", "REVOKE anon", "REVOKE public"]}'::jsonb
);