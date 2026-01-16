-- Forçar RLS em todas as tabelas com dados sensíveis
-- Isso garante que as políticas RLS sejam aplicadas mesmo para table owners

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.calculations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;