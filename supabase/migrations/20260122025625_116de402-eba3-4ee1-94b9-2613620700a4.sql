-- Fix profiles table RLS policies
-- Remove redundant RESTRICTIVE deny policy and convert to PERMISSIVE

DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix calculations table RLS policies
DROP POLICY IF EXISTS "Deny anonymous access to calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can view their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can insert their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can update their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can delete their own calculations" ON public.calculations;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view their own calculations"
ON public.calculations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculations"
ON public.calculations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calculations"
ON public.calculations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculations"
ON public.calculations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);