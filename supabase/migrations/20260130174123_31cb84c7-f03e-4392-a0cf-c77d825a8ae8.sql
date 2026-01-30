-- Adicionar coluna para referência ao cálculo original (versionamento)
ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS duplicated_from UUID NULL;

-- Criar índice para performance em consultas
CREATE INDEX IF NOT EXISTS idx_calculations_duplicated_from 
ON public.calculations(duplicated_from);

-- Adicionar coluna para controle de edições por mês (para limite de FREE users)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_edits_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_edits_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month';

-- Função para verificar e incrementar edições
CREATE OR REPLACE FUNCTION public.check_edit_limit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_plan TEXT;
    v_trial_ends_at TIMESTAMP WITH TIME ZONE;
    v_is_trial_active BOOLEAN;
    v_monthly_edits_count INTEGER;
    v_monthly_edits_reset_at TIMESTAMP WITH TIME ZONE;
    v_max_edits_free INTEGER := 3; -- Limite de edições por mês para FREE
BEGIN
    -- Buscar dados do usuário
    SELECT plan, trial_ends_at, monthly_edits_count, monthly_edits_reset_at 
    INTO v_plan, v_trial_ends_at, v_monthly_edits_count, v_monthly_edits_reset_at
    FROM public.profiles
    WHERE user_id = p_user_id;

    -- PRO users tem edições ilimitadas
    IF v_plan = 'pro' THEN
        RETURN json_build_object('allowed', true, 'remaining', -1, 'plan', 'pro');
    END IF;

    -- Verificar se precisa resetar o contador mensal
    IF v_monthly_edits_reset_at <= NOW() THEN
        UPDATE public.profiles
        SET monthly_edits_count = 0,
            monthly_edits_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
        WHERE user_id = p_user_id;
        v_monthly_edits_count := 0;
    END IF;

    -- Verificar trial
    v_is_trial_active := v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW();

    -- Se trial expirado, bloquear
    IF NOT v_is_trial_active THEN
        RETURN json_build_object('allowed', false, 'reason', 'trial_expired');
    END IF;

    -- Verificar limite de edições
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

-- Função para incrementar contador de edições
CREATE OR REPLACE FUNCTION public.increment_edit_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.profiles
    SET monthly_edits_count = monthly_edits_count + 1
    WHERE user_id = p_user_id;
END;
$$;