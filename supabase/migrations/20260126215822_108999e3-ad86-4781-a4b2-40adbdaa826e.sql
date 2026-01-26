-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Disable DELETE on user data tables
-- Restrict subscription_plans to authenticated users
-- =====================================================

-- 1. PROFILES TABLE - Remove DELETE capability
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- 2. USERS TABLE - Remove DELETE capability  
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;

-- 3. SUBSCRIPTION_PLANS - Restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;

CREATE POLICY "Authenticated users can view subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (true);

-- Revoke any anon access to subscription_plans
REVOKE ALL ON public.subscription_plans FROM anon;

-- 4. Ensure anon role has no access to sensitive tables
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.calculations FROM anon;
REVOKE ALL ON public.user_roles FROM anon;