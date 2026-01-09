-- Adicionar política DELETE para permitir que usuários excluam seu próprio perfil
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);