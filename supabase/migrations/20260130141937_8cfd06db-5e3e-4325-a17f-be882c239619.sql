-- Resolver warnings de segurança restantes

-- 1. Adicionar RLS para pending_payments_safe (é uma VIEW, precisa de security_invoker)
-- A view já existe com security_invoker, precisamos adicionar política na tabela base
-- Como é uma view, ela herda as políticas da tabela base pending_payments

-- 2. Adicionar política SELECT para security_logs (usuários podem ver seus próprios logs)
CREATE POLICY "Users can view own security logs"
ON public.security_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Adicionar política SELECT para device_fingerprints (usuários podem ver seus dispositivos)
CREATE POLICY "Users can view own fingerprints"
ON public.device_fingerprints
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Adicionar política SELECT para pending_payments via pending_payments_safe view
-- A view pending_payments_safe já tem security_barrier e filtra por user_id
-- Precisamos garantir que a view tenha as políticas corretas

-- Primeiro, vamos verificar se podemos adicionar RLS à view (não é possível em views)
-- A solução é garantir que a view tem security_invoker = true (já tem)
-- E que a tabela base pending_payments tem políticas apropriadas

-- 5. Adicionar política SELECT para pending_payments (via a view segura)
-- Como já temos USING (false) para SELECT direto, usuários usam a view
-- A view pending_payments_safe já filtra corretamente

-- 6. Log de tentativas de login no trigger de handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar perfil com trial_ends_at
  INSERT INTO public.profiles (user_id, email, plan, trial_ends_at)
  VALUES (NEW.id, NEW.email, 'free', NOW() + INTERVAL '1 day')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Criar entrada na tabela users
  INSERT INTO public.users (user_id, email, name, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 'ativo')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Atribuir role padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log de segurança para novo usuário
  INSERT INTO public.security_logs (user_id, event_type, event_description)
  VALUES (NEW.id, 'user_created', 'New user account created');
  
  RETURN NEW;
END;
$$;