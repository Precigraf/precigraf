-- Update check_calculation_limit to zero out Pro-exclusive fields for non-Pro users
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

  -- Pro users have no limits and can use all fields
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

  -- SECURITY: Zero out Pro-exclusive fields for non-Pro users
  -- These fields are: ink_cost, other_material_cost, labor_cost, energy_cost, equipment_cost, rent_cost, other_operational_cost
  NEW.ink_cost := 0;
  NEW.other_material_cost := 0;
  NEW.labor_cost := 0;
  NEW.energy_cost := 0;
  NEW.equipment_cost := 0;
  NEW.rent_cost := 0;
  NEW.other_operational_cost := 0;

  RETURN NEW;
END;
$function$;