-- Adicionar política DELETE para permitir que usuários excluam seu próprio registro
-- (Importante para conformidade com GDPR e exclusão de conta)
CREATE POLICY "Users can delete their own data" 
ON public.users 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar comentário explicando que INSERT é feito via função SECURITY DEFINER
-- A função create_webhook_user já existe e é a única forma autorizada de inserir usuários
-- Não criamos política INSERT porque queremos bloquear inserções diretas