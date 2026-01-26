-- Drop existing SELECT policy and create a more explicit one
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy with explicit authentication check
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Ensure anon role has no access to profiles
REVOKE ALL ON public.profiles FROM anon;