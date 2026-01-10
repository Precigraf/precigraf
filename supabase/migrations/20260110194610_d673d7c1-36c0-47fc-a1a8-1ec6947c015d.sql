-- Remove unused SECURITY DEFINER function that could bypass RLS if misused
DROP FUNCTION IF EXISTS public.handle_new_user();