-- Add missing RLS policies for the users table

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;

-- 1. SELECT policy - allows users to view their own data
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. UPDATE policy - allows users to update their own data
CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. DELETE policy - allows users to delete their own data
CREATE POLICY "Users can delete their own data"
ON public.users
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);