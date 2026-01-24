-- Force RLS on pending_payments table to ensure strict enforcement
ALTER TABLE public.pending_payments FORCE ROW LEVEL SECURITY;

-- Force RLS on user_roles table to prevent anonymous enumeration
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- The users table already has FORCE RLS applied from previous migration
-- Just ensure policies are properly restrictive (they already use auth.uid() = user_id which implicitly requires auth)