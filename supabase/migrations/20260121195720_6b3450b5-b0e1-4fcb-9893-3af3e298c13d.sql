-- ===============================
-- 1. EXTENSÕES
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- 2. TABELA DE PLANOS DE ASSINATURA
-- ===============================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  max_calculations integer NOT NULL,
  can_export boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Inserir planos
INSERT INTO public.subscription_plans (name, max_calculations, can_export)
VALUES
  ('free', 2, false),
  ('lifetime', 999999, true)
ON CONFLICT (name) DO NOTHING;

-- ===============================
-- 3. AJUSTES EM PROFILES
-- ===============================
-- Adicionar plan_id se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_id uuid;

-- Vincular plan_id à tabela de planos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_plan_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);
  END IF;
END $$;

-- Definir plano FREE para usuários sem plan_id (baseado na coluna plan existente)
UPDATE public.profiles
SET plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'free')
WHERE plan_id IS NULL AND (plan IS NULL OR plan = 'free');

UPDATE public.profiles
SET plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'lifetime')
WHERE plan_id IS NULL AND plan = 'pro';

-- ===============================
-- 4. FUNÇÃO DE LIMITE DE CÁLCULOS
-- ===============================
CREATE OR REPLACE FUNCTION public.check_calculation_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calc_count integer;
  max_allowed integer;
BEGIN
  SELECT COUNT(*) INTO calc_count
  FROM public.calculations
  WHERE user_id = NEW.user_id;

  SELECT sp.max_calculations INTO max_allowed
  FROM public.profiles p
  JOIN public.subscription_plans sp ON sp.id = p.plan_id
  WHERE p.user_id = NEW.user_id;

  -- Se não encontrar plano, assume limite free
  IF max_allowed IS NULL THEN
    max_allowed := 2;
  END IF;

  IF calc_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de cálculos atingido. Faça upgrade para continuar.';
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger apenas se não existir
DROP TRIGGER IF EXISTS limit_calculations ON public.calculations;
CREATE TRIGGER limit_calculations
BEFORE INSERT ON public.calculations
FOR EACH ROW
EXECUTE FUNCTION public.check_calculation_limit();

-- ===============================
-- 5. RLS PARA SUBSCRIPTION_PLANS
-- ===============================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Todos podem ver os planos (são dados públicos)
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (true);

-- ===============================
-- 6. GARANTIR PROFILES COM PLAN_ID
-- ===============================
INSERT INTO public.profiles (user_id, email, plan, plan_id)
SELECT
  u.id,
  u.email,
  'free',
  (SELECT id FROM public.subscription_plans WHERE name = 'free')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;