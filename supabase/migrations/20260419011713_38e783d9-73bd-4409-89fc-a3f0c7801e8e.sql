-- 1) Default trial: 2 days for new users
ALTER TABLE public.profiles
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '2 days');

-- 2) Update handle_new_user to use 2 days
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_free_plan_id uuid;
BEGIN
  SELECT id INTO v_free_plan_id FROM public.subscription_plans WHERE name = 'free' LIMIT 1;

  INSERT INTO public.profiles (user_id, email, plan_id, trial_ends_at)
  VALUES (NEW.id, NEW.email, v_free_plan_id, NOW() + INTERVAL '2 days')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.users (user_id, email, name, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 'ativo')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.security_logs (user_id, event_type, event_description)
  VALUES (NEW.id, 'user_created', 'New user account created');

  RETURN NEW;
END;
$function$;

-- 3) Reactivate ALL free users with a fresh 2-day trial from now
UPDATE public.profiles p
SET trial_ends_at = now() + interval '2 days',
    updated_at = now()
FROM public.subscription_plans sp
WHERE sp.id = p.plan_id
  AND sp.name <> 'lifetime';

-- 4) Update check_calculation_limit to NOT zero-out pro fields during trial
CREATE OR REPLACE FUNCTION public.check_calculation_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    calc_count integer;
    max_allowed integer;
    v_plan_name text;
    user_trial_ends_at timestamp with time zone;
    is_trial_active boolean;
BEGIN
    SELECT sp.name, pr.trial_ends_at, sp.max_calculations
    INTO v_plan_name, user_trial_ends_at, max_allowed
    FROM public.profiles pr
    JOIN public.subscription_plans sp ON sp.id = pr.plan_id
    WHERE pr.user_id = NEW.user_id;

    IF v_plan_name = 'lifetime' THEN
        INSERT INTO public.security_logs (user_id, event_type, event_description)
        VALUES (NEW.user_id, 'calculation_created', 'Pro user created calculation');
        RETURN NEW;
    END IF;

    is_trial_active := user_trial_ends_at IS NOT NULL AND user_trial_ends_at > NOW();

    IF NOT is_trial_active THEN
        INSERT INTO public.security_logs (user_id, event_type, event_description)
        VALUES (NEW.user_id, 'calculation_blocked', 'Trial expired - calculation blocked');
        RAISE EXCEPTION 'Seu período de teste terminou. Faça upgrade para continuar usando o sistema.';
    END IF;

    SELECT COUNT(*) INTO calc_count
    FROM public.calculations
    WHERE user_id = NEW.user_id;

    IF max_allowed IS NULL THEN
        max_allowed := 2;
    END IF;

    IF calc_count >= max_allowed THEN
        INSERT INTO public.security_logs (user_id, event_type, event_description)
        VALUES (NEW.user_id, 'calculation_limit_reached', 'Calculation limit reached: ' || calc_count || '/' || max_allowed);
        RAISE EXCEPTION 'Limite de cálculos atingido. Faça upgrade para continuar.';
    END IF;

    -- Trial users now have full access to all fields (no zeroing)
    INSERT INTO public.security_logs (user_id, event_type, event_description)
    VALUES (NEW.user_id, 'calculation_created', 'Trial user created calculation');

    RETURN NEW;
END;
$function$;

-- 5) Bump trial-period max calculations so trial users aren't blocked at 2
UPDATE public.subscription_plans
SET max_calculations = 9999
WHERE name = 'free';

-- 6) Products table: new fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS print_type text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS finish text,
  ADD COLUMN IF NOT EXISTS production_time text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS price_tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cost numeric NOT NULL DEFAULT 0;