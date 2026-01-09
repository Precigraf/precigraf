-- Criar tabela users para controle de acesso
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado')),
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários só podem ver/atualizar seus próprios dados
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para service role (webhook) poder criar usuários
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
WITH CHECK (true);

-- Criar índice para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_user_id ON public.users(user_id);