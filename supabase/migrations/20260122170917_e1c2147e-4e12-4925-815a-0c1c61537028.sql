-- Fix has_role function to add explicit access control
-- Only allow checking own role or if caller is admin (avoiding recursion with direct query)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow checking own role OR if caller is admin (direct query to avoid recursion)
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Fix get_user_role function to add explicit access control
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  -- Allow getting own role OR if caller is admin (direct query to avoid recursion)
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  RETURN v_role;
END;
$$;