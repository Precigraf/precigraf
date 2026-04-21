-- Insert admin role for the main user
INSERT INTO public.user_roles (user_id, role)
VALUES ('f8571a55-0d50-4128-bf3b-9a56c6e2250b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all profiles (for plan changes)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all users (for status changes)
CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));