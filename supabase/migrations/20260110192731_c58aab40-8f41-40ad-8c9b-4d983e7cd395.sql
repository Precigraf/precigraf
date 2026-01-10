-- Drop the restrictive INSERT policy that blocks all direct inserts
DROP POLICY IF EXISTS "Block direct inserts - use create_webhook_user function" ON public.users;

-- Create a new INSERT policy that allows authenticated users to insert their own record
CREATE POLICY "Users can insert their own data"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);