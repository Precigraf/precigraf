-- Fix users table RLS policies
-- Remove the redundant RESTRICTIVE deny policy and convert user policies to PERMISSIVE

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Deny anonymous access to users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;

-- Recreate as PERMISSIVE policies with proper auth.uid() checks
-- PERMISSIVE is the default type, so these will work correctly

CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data"
ON public.users
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);