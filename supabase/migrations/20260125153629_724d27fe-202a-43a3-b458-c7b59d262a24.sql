-- Ensure Row Level Security is enabled and cannot be bypassed on sensitive tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_payments FORCE ROW LEVEL SECURITY;

-- (Optional hardening) Ensure tables are not accidentally granted broad privileges
REVOKE ALL ON TABLE public.users FROM anon;
REVOKE ALL ON TABLE public.users FROM public;

REVOKE ALL ON TABLE public.calculations FROM anon;
REVOKE ALL ON TABLE public.calculations FROM public;

REVOKE ALL ON TABLE public.pending_payments FROM anon;
REVOKE ALL ON TABLE public.pending_payments FROM public;

-- Re-grant minimal privileges to authenticated role to allow RLS policies to apply
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.calculations TO authenticated;
GRANT SELECT, INSERT ON TABLE public.pending_payments TO authenticated;