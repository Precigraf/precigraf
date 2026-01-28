-- Add trial_ends_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day');

-- Update existing free plan users to have trial_ends_at set (based on their created_at + 1 day)
UPDATE public.profiles 
SET trial_ends_at = created_at + INTERVAL '1 day'
WHERE trial_ends_at IS NULL AND plan = 'free';

-- Update handle_new_user function to set trial_ends_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  RETURN NEW;
END;
$function$;

-- Update check_calculation_limit function to block after trial expires
CREATE OR REPLACE FUNCTION public.check_calculation_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  calc_count integer;
  max_allowed integer;
  user_plan text;
  user_trial_ends_at timestamp with time zone;
BEGIN
  -- Get user's plan and trial_ends_at
  SELECT p.plan, p.trial_ends_at, sp.max_calculations 
  INTO user_plan, user_trial_ends_at, max_allowed
  FROM public.profiles p
  LEFT JOIN public.subscription_plans sp ON sp.id = p.plan_id
  WHERE p.user_id = NEW.user_id;

  -- Pro users have no limits
  IF user_plan = 'pro' THEN
    RETURN NEW;
  END IF;

  -- Check if trial has expired for free users
  IF user_plan = 'free' AND user_trial_ends_at IS NOT NULL AND user_trial_ends_at < NOW() THEN
    RAISE EXCEPTION 'Seu período de teste terminou. Faça upgrade para continuar usando o sistema.';
  END IF;

  -- Count existing calculations
  SELECT COUNT(*) INTO calc_count
  FROM public.calculations
  WHERE user_id = NEW.user_id;

  -- If no plan limit found, use free plan limit
  IF max_allowed IS NULL THEN
    max_allowed := 2;
  END IF;

  -- Check calculation limit (applies during trial)
  IF calc_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de cálculos atingido. Faça upgrade para continuar.';
  END IF;

  RETURN NEW;
END;
$function$;