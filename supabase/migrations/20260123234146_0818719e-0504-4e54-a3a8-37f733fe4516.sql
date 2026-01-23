-- =====================================================
-- FIX: Ensure RLS is FORCED on users and calculations tables
-- This blocks anonymous access even if policies only apply to authenticated users
-- =====================================================

-- Force RLS on users table to block anonymous access
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Force RLS on calculations table to block anonymous access  
ALTER TABLE public.calculations FORCE ROW LEVEL SECURITY;