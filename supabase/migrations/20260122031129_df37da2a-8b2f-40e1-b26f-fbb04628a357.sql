-- Apply FORCE ROW LEVEL SECURITY to all tables to ensure policies apply even to table owner
-- This provides defense-in-depth against accidental bypasses

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.calculations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans FORCE ROW LEVEL SECURITY;