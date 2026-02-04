-- Strengthen RLS security for users and profiles tables
-- Ensure FORCE RLS is enabled and anonymous/public access is explicitly revoked

-- USERS TABLE: Force RLS and revoke anonymous access
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM public;

-- PROFILES TABLE: Force RLS and revoke anonymous access  
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Log security hardening action
INSERT INTO public.security_logs (event_type, event_description, metadata)
VALUES (
  'security_hardening', 
  'Applied FORCE RLS and revoked anonymous access on users and profiles tables',
  '{"tables": ["users", "profiles"], "actions": ["FORCE ROW LEVEL SECURITY", "REVOKE anon", "REVOKE public"]}'::jsonb
);