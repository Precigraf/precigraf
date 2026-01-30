-- =====================================================
-- AUDITORIA DE SEGURANÇA COMPLETA - PRECIGRAF
-- =====================================================

-- 1. GARANTIR RLS HABILITADO EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 2. FORÇAR RLS (Previne bypass por superusuários/service role)
-- =====================================================
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.calculations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pending_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- 3. TABELA DE LOGS DE SEGURANÇA (AUDITORIA)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type TEXT NOT NULL,
    event_description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs FORCE ROW LEVEL SECURITY;

-- Apenas inserção permitida (nunca leitura/update/delete por usuário)
CREATE POLICY "Users can insert own security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. TABELA DE FINGERPRINTS PARA ANTI-FRAUDE DE TRIAL
-- =====================================================
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    fingerprint_hash TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fingerprint_hash)
);

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints FORCE ROW LEVEL SECURITY;

-- Apenas inserção pelo usuário
CREATE POLICY "Users can insert own fingerprints"
ON public.device_fingerprints
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. TABELA DE RATE LIMITING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP ou user_id
    action_type TEXT NOT NULL, -- 'login', 'api', etc.
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, action_type)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits FORCE ROW LEVEL SECURITY;

-- Nenhuma política de SELECT para usuários comuns
-- Será gerenciado apenas por funções SECURITY DEFINER

-- 6. FUNÇÃO DE VALIDAÇÃO DE PLANO SERVER-SIDE (SECURITY DEFINER)
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_user_plan(p_user_id UUID, p_feature TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan TEXT;
    v_trial_ends_at TIMESTAMP WITH TIME ZONE;
    v_is_trial_active BOOLEAN;
    v_pro_features TEXT[] := ARRAY[
        'marketplace', 
        'quantity_simulator', 
        'operational_costs',
        'ink_cost',
        'other_materials',
        'coupon_strategy',
        'export_pdf',
        'export_excel',
        'ai_assistant'
    ];
BEGIN
    -- Buscar plano e trial do usuário
    SELECT plan, trial_ends_at INTO v_plan, v_trial_ends_at
    FROM public.profiles
    WHERE user_id = p_user_id;

    -- Se não encontrou perfil
    IF v_plan IS NULL THEN
        RETURN json_build_object('allowed', false, 'reason', 'user_not_found');
    END IF;

    -- Usuário PRO tem acesso total
    IF v_plan = 'pro' THEN
        RETURN json_build_object('allowed', true, 'plan', 'pro');
    END IF;

    -- Verificar se trial está ativo
    v_is_trial_active := v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW();

    -- Se feature é PRO-only
    IF p_feature = ANY(v_pro_features) THEN
        IF v_is_trial_active THEN
            RETURN json_build_object('allowed', true, 'plan', 'trial', 'trial_ends_at', v_trial_ends_at);
        ELSE
            RETURN json_build_object('allowed', false, 'reason', 'pro_feature_blocked', 'required_plan', 'pro');
        END IF;
    END IF;

    -- Features básicas
    IF v_is_trial_active THEN
        RETURN json_build_object('allowed', true, 'plan', 'trial');
    ELSE
        RETURN json_build_object('allowed', false, 'reason', 'trial_expired');
    END IF;
END;
$$;

-- 7. FUNÇÃO DE RATE LIMITING SERVER-SIDE
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action_type TEXT,
    p_max_requests INTEGER DEFAULT 60,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rate_limit RECORD;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar rate limit existente
    SELECT * INTO v_rate_limit
    FROM public.rate_limits
    WHERE identifier = p_identifier AND action_type = p_action_type;

    -- Se está bloqueado
    IF v_rate_limit.blocked_until IS NOT NULL AND v_rate_limit.blocked_until > v_now THEN
        RETURN json_build_object(
            'allowed', false, 
            'reason', 'rate_limited', 
            'blocked_until', v_rate_limit.blocked_until,
            'retry_after_seconds', EXTRACT(EPOCH FROM (v_rate_limit.blocked_until - v_now))::INTEGER
        );
    END IF;

    v_window_start := v_now - (p_window_seconds || ' seconds')::INTERVAL;

    -- Se existe registro e está dentro da janela
    IF v_rate_limit.id IS NOT NULL AND v_rate_limit.window_start > v_window_start THEN
        -- Verificar se excedeu
        IF v_rate_limit.request_count >= p_max_requests THEN
            -- Bloquear por 5 minutos
            UPDATE public.rate_limits
            SET blocked_until = v_now + INTERVAL '5 minutes'
            WHERE id = v_rate_limit.id;

            -- Registrar log de segurança
            INSERT INTO public.security_logs (event_type, event_description, metadata)
            VALUES ('rate_limit_exceeded', 'Rate limit exceeded for ' || p_action_type, 
                    json_build_object('identifier', p_identifier, 'action', p_action_type));

            RETURN json_build_object(
                'allowed', false, 
                'reason', 'rate_limited',
                'retry_after_seconds', 300
            );
        ELSE
            -- Incrementar contador
            UPDATE public.rate_limits
            SET request_count = request_count + 1
            WHERE id = v_rate_limit.id;

            RETURN json_build_object('allowed', true, 'remaining', p_max_requests - v_rate_limit.request_count - 1);
        END IF;
    ELSE
        -- Criar ou resetar registro
        INSERT INTO public.rate_limits (identifier, action_type, request_count, window_start, blocked_until)
        VALUES (p_identifier, p_action_type, 1, v_now, NULL)
        ON CONFLICT (identifier, action_type)
        DO UPDATE SET request_count = 1, window_start = v_now, blocked_until = NULL;

        RETURN json_build_object('allowed', true, 'remaining', p_max_requests - 1);
    END IF;
END;
$$;

-- 8. FUNÇÃO DE VERIFICAÇÃO DE FINGERPRINT (ANTI-FRAUDE)
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_device_fingerprint(
    p_user_id UUID,
    p_fingerprint_hash TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing RECORD;
    v_suspicious BOOLEAN := false;
BEGIN
    -- Verificar se fingerprint já existe para outro usuário
    SELECT * INTO v_existing
    FROM public.device_fingerprints
    WHERE fingerprint_hash = p_fingerprint_hash
    AND user_id != p_user_id;

    IF v_existing.id IS NOT NULL THEN
        v_suspicious := true;
        
        -- Registrar log de segurança
        INSERT INTO public.security_logs (user_id, event_type, event_description, ip_address, user_agent, metadata)
        VALUES (p_user_id, 'suspicious_device', 'Device fingerprint already associated with another account',
                p_ip_address, p_user_agent,
                json_build_object('existing_user_id', v_existing.user_id, 'fingerprint', LEFT(p_fingerprint_hash, 10)));
    END IF;

    -- Registrar fingerprint para o usuário atual (ignora se já existe)
    INSERT INTO public.device_fingerprints (user_id, fingerprint_hash, ip_address, user_agent)
    VALUES (p_user_id, p_fingerprint_hash, p_ip_address, p_user_agent)
    ON CONFLICT (fingerprint_hash) DO NOTHING;

    RETURN json_build_object('suspicious', v_suspicious, 'registered', true);
END;
$$;

-- 9. FUNÇÃO DE LOG DE SEGURANÇA
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_description TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.security_logs (user_id, event_type, event_description, ip_address, user_agent, metadata)
    VALUES (p_user_id, p_event_type, p_description, p_ip_address, p_user_agent, p_metadata);
END;
$$;

-- 10. ATUALIZAR TRIGGER DE CÁLCULOS PARA VALIDAÇÃO MAIS RIGOROSA
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_calculation_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    calc_count integer;
    max_allowed integer;
    user_plan text;
    user_trial_ends_at timestamp with time zone;
    is_trial_active boolean;
BEGIN
    -- Get user's plan and trial_ends_at
    SELECT p.plan, p.trial_ends_at, sp.max_calculations 
    INTO user_plan, user_trial_ends_at, max_allowed
    FROM public.profiles p
    LEFT JOIN public.subscription_plans sp ON sp.id = p.plan_id
    WHERE p.user_id = NEW.user_id;

    -- Pro users have no limits and can use all fields
    IF user_plan = 'pro' THEN
        -- Log ação
        INSERT INTO public.security_logs (user_id, event_type, event_description)
        VALUES (NEW.user_id, 'calculation_created', 'Pro user created calculation');
        RETURN NEW;
    END IF;

    -- Check if trial is active
    is_trial_active := user_trial_ends_at IS NOT NULL AND user_trial_ends_at > NOW();

    -- If trial expired for free users, block completely
    IF user_plan = 'free' AND NOT is_trial_active THEN
        -- Log tentativa bloqueada
        INSERT INTO public.security_logs (user_id, event_type, event_description)
        VALUES (NEW.user_id, 'calculation_blocked', 'Trial expired - calculation blocked');
        
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
        -- Log tentativa bloqueada
        INSERT INTO public.security_logs (user_id, event_type, event_description)
        VALUES (NEW.user_id, 'calculation_limit_reached', 'Calculation limit reached: ' || calc_count || '/' || max_allowed);
        
        RAISE EXCEPTION 'Limite de cálculos atingido. Faça upgrade para continuar.';
    END IF;

    -- SECURITY: Zero out Pro-exclusive fields for non-Pro users
    NEW.ink_cost := 0;
    NEW.other_material_cost := 0;
    NEW.labor_cost := 0;
    NEW.energy_cost := 0;
    NEW.equipment_cost := 0;
    NEW.rent_cost := 0;
    NEW.other_operational_cost := 0;

    -- Log ação bem-sucedida
    INSERT INTO public.security_logs (user_id, event_type, event_description)
    VALUES (NEW.user_id, 'calculation_created', 'Trial user created calculation');

    RETURN NEW;
END;
$$;

-- 11. TRIGGER PARA LOG DE ALTERAÇÕES DE PLANO
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.plan != NEW.plan OR OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
        INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
        VALUES (
            NEW.user_id, 
            'plan_changed', 
            'Plan changed from ' || COALESCE(OLD.plan, 'null') || ' to ' || NEW.plan,
            json_build_object('old_plan', OLD.plan, 'new_plan', NEW.plan, 'old_plan_id', OLD.plan_id, 'new_plan_id', NEW.plan_id)
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Criar trigger para log de mudança de plano
DROP TRIGGER IF EXISTS log_plan_change_trigger ON public.profiles;
CREATE TRIGGER log_plan_change_trigger
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_plan_change();

-- 12. REVOGAR PRIVILÉGIOS DESNECESSÁRIOS
-- =====================================================
REVOKE ALL ON public.security_logs FROM anon, authenticated;
GRANT INSERT ON public.security_logs TO authenticated;

REVOKE ALL ON public.device_fingerprints FROM anon, authenticated;
GRANT INSERT ON public.device_fingerprints TO authenticated;

REVOKE ALL ON public.rate_limits FROM anon, authenticated;
-- rate_limits só pode ser acessado via funções SECURITY DEFINER

-- 13. ÍNDICES PARA PERFORMANCE DE QUERIES DE SEGURANÇA
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON public.device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user ON public.device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON public.rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- 14. LIMPAR RATE LIMITS ANTIGOS (Função para job agendado)
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;