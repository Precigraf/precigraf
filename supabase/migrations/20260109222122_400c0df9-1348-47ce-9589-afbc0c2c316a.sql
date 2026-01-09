-- Adicionar política INSERT que bloqueia TODAS as inserções diretas
-- A criação de usuários é feita exclusivamente via função SECURITY DEFINER create_webhook_user
-- que bypassa RLS e é chamada apenas pelo webhook com service_role
CREATE POLICY "Block direct inserts - use create_webhook_user function" 
ON public.users 
FOR INSERT 
WITH CHECK (false);