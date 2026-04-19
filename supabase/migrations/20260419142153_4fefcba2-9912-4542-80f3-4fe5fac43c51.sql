-- 1. Adicionar plano pro_monthly
INSERT INTO public.subscription_plans (name, max_calculations, can_export)
VALUES ('pro_monthly', 999999, true)
ON CONFLICT DO NOTHING;

-- 2. Adicionar campos de assinatura na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_canceled_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);

-- 3. Atualizar sync_plan_from_plan_id para reconhecer pro_monthly
CREATE OR REPLACE FUNCTION public.sync_plan_from_plan_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_name text;
BEGIN
  SELECT name INTO v_plan_name FROM public.subscription_plans WHERE id = NEW.plan_id;
  IF v_plan_name IN ('lifetime', 'pro_monthly') THEN
    NEW.plan := 'pro';
  ELSE
    NEW.plan := COALESCE(v_plan_name, 'free');
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Atualizar validate_user_plan para considerar pro_monthly ativo
CREATE OR REPLACE FUNCTION public.validate_user_plan(p_user_id uuid, p_feature text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_plan_name TEXT;
    v_trial_ends_at TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
    v_sub_status TEXT;
    v_is_trial_active BOOLEAN;
    v_is_monthly_active BOOLEAN;
    v_pro_features TEXT[] := ARRAY[
        'marketplace', 'quantity_simulator', 'operational_costs',
        'ink_cost', 'other_materials', 'coupon_strategy',
        'export_pdf', 'export_excel', 'ai_assistant'
    ];
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;

    SELECT sp.name, pr.trial_ends_at, pr.subscription_current_period_end, pr.subscription_status
    INTO v_plan_name, v_trial_ends_at, v_period_end, v_sub_status
    FROM public.profiles pr
    JOIN public.subscription_plans sp ON sp.id = pr.plan_id
    WHERE pr.user_id = p_user_id;

    IF v_plan_name IS NULL THEN
        RETURN json_build_object('allowed', false, 'reason', 'invalid_request');
    END IF;

    IF v_plan_name = 'lifetime' THEN
        RETURN json_build_object('allowed', true, 'plan', 'pro');
    END IF;

    v_is_monthly_active := v_plan_name = 'pro_monthly'
      AND v_sub_status IN ('active', 'trialing')
      AND (v_period_end IS NULL OR v_period_end > NOW());

    IF v_is_monthly_active THEN
        RETURN json_build_object('allowed', true, 'plan', 'pro');
    END IF;

    v_is_trial_active := v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW();

    IF p_feature = ANY(v_pro_features) THEN
        IF v_is_trial_active THEN
            RETURN json_build_object('allowed', true, 'plan', 'trial', 'trial_ends_at', v_trial_ends_at);
        ELSE
            RETURN json_build_object('allowed', false, 'reason', 'pro_feature_blocked', 'required_plan', 'pro');
        END IF;
    END IF;

    IF v_is_trial_active THEN
        RETURN json_build_object('allowed', true, 'plan', 'trial');
    ELSE
        RETURN json_build_object('allowed', false, 'reason', 'trial_expired');
    END IF;
END;
$function$;

-- 5. Atualizar check_calculation_limit para liberar pro_monthly ativo
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
    v_period_end timestamp with time zone;
    v_sub_status text;
    is_trial_active boolean;
    is_monthly_active boolean;
BEGIN
    SELECT sp.name, pr.trial_ends_at, sp.max_calculations,
           pr.subscription_current_period_end, pr.subscription_status
    INTO v_plan_name, user_trial_ends_at, max_allowed, v_period_end, v_sub_status
    FROM public.profiles pr
    JOIN public.subscription_plans sp ON sp.id = pr.plan_id
    WHERE pr.user_id = NEW.user_id;

    IF v_plan_name = 'lifetime' THEN
        INSERT INTO public.security_logs (user_id, event_type, event_description)
        VALUES (NEW.user_id, 'calculation_created', 'Lifetime user created calculation');
        RETURN NEW;
    END IF;

    is_monthly_active := v_plan_name = 'pro_monthly'
      AND v_sub_status IN ('active', 'trialing')
      AND (v_period_end IS NULL OR v_period_end > NOW());

    IF is_monthly_active THEN
        INSERT INTO public.security_logs (user_id, event_type, event_description)
        VALUES (NEW.user_id, 'calculation_created', 'Pro monthly user created calculation');
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

    INSERT INTO public.security_logs (user_id, event_type, event_description)
    VALUES (NEW.user_id, 'calculation_created', 'Trial user created calculation');

    RETURN NEW;
END;
$function$;

-- 6. RPC para ativar assinatura mensal (chamada pelo webhook stripe)
CREATE OR REPLACE FUNCTION public.activate_monthly_subscription(
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_status text,
  p_current_period_end timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_monthly_plan_id uuid;
BEGIN
  SELECT id INTO v_monthly_plan_id
  FROM public.subscription_plans
  WHERE name = 'pro_monthly'
  LIMIT 1;

  IF v_monthly_plan_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Plan not found');
  END IF;

  UPDATE public.profiles
  SET plan_id = v_monthly_plan_id,
      stripe_customer_id = p_stripe_customer_id,
      stripe_subscription_id = p_stripe_subscription_id,
      subscription_status = p_status,
      subscription_current_period_end = p_current_period_end,
      subscription_canceled_at = NULL,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
  VALUES (
    p_user_id,
    'subscription_activated',
    'Monthly subscription activated',
    json_build_object('subscription_id', p_stripe_subscription_id, 'status', p_status)
  );

  RETURN json_build_object('success', true);
END;
$$;

-- 7. RPC para atualizar status da assinatura (renovação, cancelamento)
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  p_stripe_subscription_id text,
  p_status text,
  p_current_period_end timestamp with time zone,
  p_canceled_at timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_free_plan_id uuid;
  v_monthly_plan_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE stripe_subscription_id = p_stripe_subscription_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Subscription not found');
  END IF;

  -- Se cancelada e fora do período, voltar para free
  IF p_status IN ('canceled', 'incomplete_expired', 'unpaid') AND
     (p_current_period_end IS NULL OR p_current_period_end <= NOW()) THEN
    SELECT id INTO v_free_plan_id FROM public.subscription_plans WHERE name = 'free' LIMIT 1;
    UPDATE public.profiles
    SET plan_id = v_free_plan_id,
        subscription_status = p_status,
        subscription_canceled_at = COALESCE(p_canceled_at, NOW()),
        updated_at = now()
    WHERE user_id = v_user_id;
  ELSE
    -- Manter pro_monthly e atualizar status/período
    SELECT id INTO v_monthly_plan_id FROM public.subscription_plans WHERE name = 'pro_monthly' LIMIT 1;
    UPDATE public.profiles
    SET plan_id = v_monthly_plan_id,
        subscription_status = p_status,
        subscription_current_period_end = p_current_period_end,
        subscription_canceled_at = p_canceled_at,
        updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
  VALUES (
    v_user_id,
    'subscription_updated',
    'Subscription status updated to ' || p_status,
    json_build_object('subscription_id', p_stripe_subscription_id, 'status', p_status, 'period_end', p_current_period_end)
  );

  RETURN json_build_object('success', true);
END;
$$;