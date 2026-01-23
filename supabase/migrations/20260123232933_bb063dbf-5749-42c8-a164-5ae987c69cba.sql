-- Fix: Convert RESTRICTIVE policies to PERMISSIVE for calculations table
-- RESTRICTIVE policies alone don't grant access, they only restrict
-- We need PERMISSIVE policies scoped to authenticated users

-- Drop existing RESTRICTIVE policies on calculations
DROP POLICY IF EXISTS "Users can view their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can insert their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can update their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can delete their own calculations" ON public.calculations;

-- Create PERMISSIVE policies for calculations (properly secured)
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

-- Fix: Convert RESTRICTIVE policies to PERMISSIVE for users table
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;

-- Create PERMISSIVE policies for users (properly secured)
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

-- Ensure RLS is enabled and forced
ALTER TABLE public.calculations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;