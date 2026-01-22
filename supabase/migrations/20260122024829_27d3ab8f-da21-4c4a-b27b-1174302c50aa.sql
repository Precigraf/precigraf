-- Remove the redundant RESTRICTIVE policy that could cause issues
-- The existing policies already provide adequate protection:
-- - "Users can view their own roles" restricts SELECT to owner
-- - "Admins can view all roles" allows admin SELECT access
-- - "Admins can manage roles" allows admin full access
-- These RESTRICTIVE policies already properly secure the table

DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;