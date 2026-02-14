
-- ============================================
-- SAAS SECURITY HARDENING - FULL MIGRATION
-- ============================================

-- =====================
-- 5️⃣ PERFORMANCE INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON public.calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON public.pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON public.pending_payments(status);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON public.device_fingerprints(fingerprint_hash);

-- =====================
-- 2️⃣ UNIQUE INDEX - PREVENT WEBHOOK REPLAY
-- =====================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_payment_provider
ON public.pending_payments(payment_provider_id)
WHERE payment_provider_id IS NOT NULL;

-- =====================
-- 7️⃣ VALIDATION TRIGGER FOR CALCULATIONS (Supabase best practice: triggers instead of CHECK constraints)
-- =====================
CREATE OR REPLACE FUNCTION public.validate_calculation_values()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.lot_quantity < 0 OR NEW.lot_cost < 0 OR NEW.paper_cost < 0 
     OR NEW.ink_cost < 0 OR NEW.sale_price < 0 OR NEW.varnish_cost < 0
     OR NEW.other_material_cost < 0 OR NEW.labor_cost < 0 OR NEW.energy_cost < 0
     OR NEW.equipment_cost < 0 OR NEW.rent_cost < 0 OR NEW.other_operational_cost < 0 THEN
    RAISE EXCEPTION 'Values cannot be negative';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_calculation_values_trigger ON public.calculations;
CREATE TRIGGER validate_calculation_values_trigger
BEFORE INSERT OR UPDATE ON public.calculations
FOR EACH ROW EXECUTE FUNCTION public.validate_calculation_values();

-- =====================
-- 3️⃣ SINGLE SOURCE OF TRUTH: plan_id replaces plan TEXT
-- =====================

-- Ensure required plans exist
INSERT INTO public.subscription_plans (name, max_calculations, can_export)
SELECT 'free', 2, false
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'free');

INSERT INTO public.subscription_plans (name, max_calculations, can_export)
SELECT 'lifetime', 999999, true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'lifetime');

-- Backfill plan_id for existing profiles
UPDATE public.profiles p
SET plan_id = sp.id
FROM public.subscription_plans sp
WHERE p.plan_id IS NULL
  AND (
    (p.plan = 'free' AND sp.name = 'free')
    OR (p.plan = 'pro' AND sp.name = 'lifetime')
  );

-- Fallback: any remaining NULL plan_id gets free
UPDATE public.profiles p
SET plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'free' LIMIT 1)
WHERE p.plan_id IS NULL;

-- Helper function for default value
CREATE OR REPLACE FUNCTION public.get_free_plan_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$ SELECT id FROM public.subscription_plans WHERE name = 'free' LIMIT 1; $$;

-- Make plan_id NOT NULL with default
ALTER TABLE public.profiles ALTER COLUMN plan_id SET DEFAULT public.get_free_plan_id();
ALTER TABLE public.profiles ALTER COLUMN plan_id SET NOT NULL;

-- Sync trigger: plan_id is source of truth, plan TEXT auto-derives
CREATE OR REPLACE FUNCTION public.sync_plan_from_plan_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan_name text;
BEGIN
  SELECT name INTO v_plan_name FROM public.subscription_plans WHERE id = NEW.plan_id;
  IF v_plan_name = 'lifetime' THEN
    NEW.plan := 'pro';
  ELSE
    NEW.plan := COALESCE(v_plan_name, 'free');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_plan_trigger ON public.profiles;
CREATE TRIGGER sync_plan_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_plan_from_plan_id();

-- =====================
-- 1️⃣ HARDENED SECURITY DEFINER FUNCTIONS
-- (auth.uid() check allows service-role calls where auth.uid() IS NULL)
-- =====================

-- check_edit_limit: JOIN subscription_plans instead of plan TEXT
CREATE OR REPLACE FUNCTION public.check_edit_limit(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_plan_name TEXT;
    v_trial_ends_at TIMESTAMP WITH TIME ZONE;
    v_is_trial_active BOOLEAN;
    v_monthly_edits_count INTEGER;
    v_monthly_edits_reset_at TIMESTAMP WITH TIME ZONE;
    v_max_edits_free INTEGER := 3;
BEGIN
    -- 1️⃣ SECURITY: prevent client-side impersonation
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;

    -- JOIN with subscription_plans for single source of truth
    SELECT sp.name, pr.trial_ends_at, pr.monthly_edits_count, pr.monthly_edits_reset_at
    INTO v_plan_name, v_trial_ends_at, v_monthly_edits_count, v_monthly_edits_reset_at
    FROM public.profiles pr
    JOIN public.subscription_plans sp ON sp.id = pr.plan_id
    WHERE pr.user_id = p_user_id;

    IF v_plan_name IS NULL THEN
        RETURN json_build_object('allowed', false, 'reason', 'invalid_request');
    END IF;

    -- PRO/lifetime users: unlimited
    IF v_plan_name = 'lifetime' THEN
        RETURN json_build_object('allowed', true, 'remaining', -1, 'plan', 'pro');
    END IF;

    -- Reset monthly counter if needed
    IF v_monthly_edits_reset_at <= NOW() THEN
        UPDATE public.profiles
        SET monthly_edits_count = 0,
            monthly_edits_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
        WHERE user_id = p_user_id;
        v_monthly_edits_count := 0;
    END IF;

    v_is_trial_active := v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW();

    IF NOT v_is_trial_active THEN
        RETURN json_build_object('allowed', false, 'reason', 'trial_expired');
    END IF;

    IF v_monthly_edits_count >= v_max_edits_free THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'edit_limit_reached',
            'count', v_monthly_edits_count,
            'max', v_max_edits_free
        );
    END IF;

    RETURN json_build_object(
        'allowed', true,
        'remaining', v_max_edits_free - v_monthly_edits_count,
        'count', v_monthly_edits_count,
        'max', v_max_edits_free,
        'plan', 'trial'
    );
END;
$$;

-- increment_edit_count: hardened
CREATE OR REPLACE FUNCTION public.increment_edit_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;

    UPDATE public.profiles
    SET monthly_edits_count = monthly_edits_count + 1
    WHERE user_id = p_user_id;
END;
$$;

-- validate_user_plan: JOIN subscription_plans
CREATE OR REPLACE FUNCTION public.validate_user_plan(p_user_id uuid, p_feature text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_plan_name TEXT;
    v_trial_ends_at TIMESTAMP WITH TIME ZONE;
    v_is_trial_active BOOLEAN;
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

    SELECT sp.name, pr.trial_ends_at
    INTO v_plan_name, v_trial_ends_at
    FROM public.profiles pr
    JOIN public.subscription_plans sp ON sp.id = pr.plan_id
    WHERE pr.user_id = p_user_id;

    IF v_plan_name IS NULL THEN
        RETURN json_build_object('allowed', false, 'reason', 'invalid_request');
    END IF;

    IF v_plan_name = 'lifetime' THEN
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
$$;

-- check_device_fingerprint: hardened
CREATE OR REPLACE FUNCTION public.check_device_fingerprint(p_user_id uuid, p_fingerprint_hash text, p_ip_address text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_existing RECORD;
    v_suspicious BOOLEAN := false;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;

    SELECT * INTO v_existing
    FROM public.device_fingerprints
    WHERE fingerprint_hash = p_fingerprint_hash
    AND user_id != p_user_id;

    IF v_existing.id IS NOT NULL THEN
        v_suspicious := true;
        INSERT INTO public.security_logs (user_id, event_type, event_description, ip_address, user_agent, metadata)
        VALUES (p_user_id, 'suspicious_device', 'Device fingerprint already associated with another account',
                p_ip_address, p_user_agent,
                json_build_object('existing_user_id', v_existing.user_id, 'fingerprint', LEFT(p_fingerprint_hash, 10)));
    END IF;

    INSERT INTO public.device_fingerprints (user_id, fingerprint_hash, ip_address, user_agent)
    VALUES (p_user_id, p_fingerprint_hash, p_ip_address, p_user_agent)
    ON CONFLICT (fingerprint_hash) DO NOTHING;

    RETURN json_build_object('suspicious', v_suspicious, 'registered', true);
END;
$$;

-- log_security_event: hardened
CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_description text, p_ip_address text DEFAULT NULL, p_user_agent text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;

    INSERT INTO public.security_logs (user_id, event_type, event_description, ip_address, user_agent, metadata)
    VALUES (p_user_id, p_event_type, p_description, p_ip_address, p_user_agent, p_metadata);
END;
$$;

-- =====================
-- 2️⃣ BLINDAR confirm_payment_webhook (idempotency + anti-replay)
-- =====================
CREATE OR REPLACE FUNCTION public.confirm_payment_webhook(p_payment_provider_id text, p_user_email text DEFAULT NULL, p_amount numeric DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending pending_payments%ROWTYPE;
  v_user_id uuid;
BEGIN
  -- 6️⃣ ANTI-ENUMERATION: generic error messages
  IF p_user_email IS NOT NULL THEN
    SELECT p.user_id INTO v_user_id
    FROM public.profiles p
    WHERE p.email = p_user_email
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      SELECT * INTO v_pending
      FROM public.pending_payments
      WHERE user_id = v_user_id
        AND status = 'pending'
        AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
  END IF;

  IF v_pending.id IS NULL THEN
    INSERT INTO public.security_logs (event_type, event_description, metadata)
    VALUES (
      'webhook_payment_not_found',
      'Webhook received but no matching pending payment found',
      json_build_object(
        'payment_provider_id', p_payment_provider_id,
        'amount', p_amount
      )
    );
    -- 6️⃣ Never reveal if user exists or not
    RETURN json_build_object('success', false, 'error', 'Invalid request');
  END IF;

  -- 2️⃣ IDEMPOTENCY: prevent double processing
  IF v_pending.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Payment already processed');
  END IF;

  -- Atomic update with status check (prevents race condition)
  UPDATE public.pending_payments
  SET status = 'confirmed_by_webhook',
      payment_provider_id = p_payment_provider_id
  WHERE id = v_pending.id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payment already processed');
  END IF;

  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
  VALUES (
    v_pending.user_id,
    'webhook_payment_confirmed',
    'Payment confirmed by webhook',
    json_build_object(
      'payment_id', v_pending.id,
      'payment_provider_id', p_payment_provider_id,
      'amount', p_amount
    )
  );

  RETURN json_build_object('success', true, 'payment_id', v_pending.id, 'user_id', v_pending.user_id);
END;
$$;

-- verify_and_complete_payment: uses plan_id
CREATE OR REPLACE FUNCTION public.verify_and_complete_payment(p_csrf_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending pending_payments%ROWTYPE;
  v_lifetime_plan_id uuid;
BEGIN
  SELECT * INTO v_pending
  FROM public.pending_payments
  WHERE csrf_token = p_csrf_token
    AND expires_at > now()
  LIMIT 1;

  IF v_pending.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid request');
  END IF;

  IF v_pending.status != 'confirmed_by_webhook' THEN
    INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
    VALUES (
      v_pending.user_id,
      'payment_verification_blocked',
      'Payment verification attempted before webhook confirmation',
      json_build_object('payment_id', v_pending.id, 'status', v_pending.status)
    );
    RETURN json_build_object(
      'success', false,
      'error', 'Pagamento ainda não confirmado.',
      'status', 'awaiting_confirmation'
    );
  END IF;

  SELECT id INTO v_lifetime_plan_id
  FROM public.subscription_plans
  WHERE name = 'lifetime'
  LIMIT 1;

  IF v_lifetime_plan_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Internal error');
  END IF;

  -- Update plan_id (plan TEXT auto-syncs via trigger)
  UPDATE public.profiles
  SET plan_id = v_lifetime_plan_id,
      updated_at = now()
  WHERE user_id = v_pending.user_id;

  -- Atomic completion with status check
  UPDATE public.pending_payments
  SET status = 'completed',
      completed_at = now()
  WHERE id = v_pending.id
    AND status = 'confirmed_by_webhook';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payment already processed');
  END IF;

  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
  VALUES (
    v_pending.user_id,
    'payment_completed',
    'User upgraded to pro plan after webhook confirmation',
    json_build_object('payment_id', v_pending.id, 'payment_provider_id', v_pending.payment_provider_id)
  );

  RETURN json_build_object('success', true, 'message', 'Plano ativado com sucesso');
END;
$$;

-- =====================
-- 4️⃣ ATOMIC RATE LIMIT (no race condition)
-- =====================
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action_type text, p_max_requests integer DEFAULT 60, p_window_seconds integer DEFAULT 60)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_result RECORD;
BEGIN
    v_window_start := v_now - (p_window_seconds || ' seconds')::INTERVAL;

    -- Atomic upsert: single statement prevents race conditions
    INSERT INTO public.rate_limits (identifier, action_type, request_count, window_start, blocked_until)
    VALUES (p_identifier, p_action_type, 1, v_now, NULL)
    ON CONFLICT (identifier, action_type) DO UPDATE
    SET
        request_count = CASE
            -- Window expired: reset counter
            WHEN rate_limits.window_start <= v_window_start THEN 1
            -- Already blocked: keep count
            WHEN rate_limits.blocked_until IS NOT NULL AND rate_limits.blocked_until > v_now THEN rate_limits.request_count
            -- Within window: increment
            ELSE rate_limits.request_count + 1
        END,
        window_start = CASE
            WHEN rate_limits.window_start <= v_window_start THEN v_now
            ELSE rate_limits.window_start
        END,
        blocked_until = CASE
            -- Already blocked and still active
            WHEN rate_limits.blocked_until IS NOT NULL AND rate_limits.blocked_until > v_now THEN rate_limits.blocked_until
            -- Window expired: clear block
            WHEN rate_limits.window_start <= v_window_start THEN NULL
            -- Exceeded limit: block for 5 minutes
            WHEN rate_limits.request_count + 1 > p_max_requests THEN v_now + INTERVAL '5 minutes'
            ELSE NULL
        END
    RETURNING request_count, blocked_until, window_start INTO v_result;

    -- Check if blocked
    IF v_result.blocked_until IS NOT NULL AND v_result.blocked_until > v_now THEN
        -- Log only on new blocks (when count just exceeded)
        IF v_result.request_count = p_max_requests + 1 THEN
            INSERT INTO public.security_logs (event_type, event_description, metadata)
            VALUES ('rate_limit_exceeded', 'Rate limit exceeded for ' || p_action_type,
                    json_build_object('identifier', p_identifier, 'action', p_action_type));
        END IF;

        RETURN json_build_object(
            'allowed', false,
            'reason', 'rate_limited',
            'retry_after_seconds', EXTRACT(EPOCH FROM (v_result.blocked_until - v_now))::INTEGER
        );
    END IF;

    RETURN json_build_object('allowed', true, 'remaining', p_max_requests - v_result.request_count);
END;
$$;

-- =====================
-- UPDATED TRIGGER: check_calculation_limit (uses plan_id JOIN)
-- =====================
CREATE OR REPLACE FUNCTION public.check_calculation_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

    -- Pro/lifetime users have no limits
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

    -- Zero out Pro-exclusive fields for non-Pro users
    NEW.ink_cost := 0;
    NEW.other_material_cost := 0;
    NEW.labor_cost := 0;
    NEW.energy_cost := 0;
    NEW.equipment_cost := 0;
    NEW.rent_cost := 0;
    NEW.other_operational_cost := 0;

    INSERT INTO public.security_logs (user_id, event_type, event_description)
    VALUES (NEW.user_id, 'calculation_created', 'Trial user created calculation');

    RETURN NEW;
END;
$$;

-- =====================
-- UPDATED TRIGGER: handle_new_user (uses plan_id)
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_free_plan_id uuid;
BEGIN
  SELECT id INTO v_free_plan_id FROM public.subscription_plans WHERE name = 'free' LIMIT 1;

  INSERT INTO public.profiles (user_id, email, plan_id, trial_ends_at)
  VALUES (NEW.id, NEW.email, v_free_plan_id, NOW() + INTERVAL '1 day')
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
$$;

-- =====================
-- 8️⃣ HARDENING: Ensure log_plan_change uses plan_id
-- =====================
CREATE OR REPLACE FUNCTION public.log_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
        INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
        VALUES (
            NEW.user_id,
            'plan_changed',
            'Plan changed',
            json_build_object('old_plan_id', OLD.plan_id, 'new_plan_id', NEW.plan_id)
        );
    END IF;
    RETURN NEW;
END;
$$;
