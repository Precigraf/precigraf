-- Revogar permissões públicas das tabelas para garantir que apenas usuários autenticados possam acessar

-- Revogar SELECT do role anon na tabela users
REVOKE SELECT ON public.users FROM anon;

-- Revogar SELECT do role anon na tabela calculations
REVOKE SELECT ON public.calculations FROM anon;

-- Revogar SELECT do role anon na tabela profiles
REVOKE SELECT ON public.profiles FROM anon;

-- Garantir que apenas o role authenticated tenha acesso às tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;