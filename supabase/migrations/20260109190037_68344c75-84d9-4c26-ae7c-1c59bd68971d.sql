-- Remover a política permissiva existente
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Criar função SECURITY DEFINER para inserção segura de usuários via webhook
-- Esta função só pode ser chamada pelo service_role e valida os dados
CREATE OR REPLACE FUNCTION public.create_webhook_user(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Validar que os parâmetros obrigatórios estão presentes
  IF p_user_id IS NULL OR p_email IS NULL THEN
    RAISE EXCEPTION 'user_id and email are required';
  END IF;
  
  -- Validar formato básico de email
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Verificar se o user_id existe em auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Invalid user_id - user does not exist in auth.users';
  END IF;
  
  -- Inserir o usuário
  INSERT INTO public.users (user_id, email, name, status, must_change_password)
  VALUES (p_user_id, p_email, p_name, 'ativo', true)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Revogar acesso público à função
REVOKE ALL ON FUNCTION public.create_webhook_user FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_webhook_user FROM anon;
REVOKE ALL ON FUNCTION public.create_webhook_user FROM authenticated;