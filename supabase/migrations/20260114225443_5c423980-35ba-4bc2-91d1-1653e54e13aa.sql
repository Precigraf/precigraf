-- Adicionar política explícita para negar acesso anônimo à tabela users
-- Isso garante que apenas usuários autenticados possam acessar a tabela
CREATE POLICY "Deny anonymous access to users"
ON public.users
FOR SELECT
TO anon
USING (false);

-- Adicionar política explícita para negar acesso anônimo à tabela calculations
CREATE POLICY "Deny anonymous access to calculations"
ON public.calculations
FOR SELECT
TO anon
USING (false);

-- Adicionar política explícita para negar acesso anônimo à tabela profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Adicionar política explícita para negar acesso anônimo à tabela user_roles
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);