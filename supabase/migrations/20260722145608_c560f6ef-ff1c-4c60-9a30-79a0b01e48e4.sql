
-- 1. Colunas em quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_responded_at timestamptz;

CREATE INDEX IF NOT EXISTS quotes_followup_due_idx
  ON public.quotes (followup_scheduled_at)
  WHERE followup_scheduled_at IS NOT NULL
    AND followup_sent_count = 0
    AND client_responded_at IS NULL;

-- 2. Configurações de follow-up
CREATE TABLE IF NOT EXISTS public.quote_followup_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  delay_hours integer NOT NULL DEFAULT 24 CHECK (delay_hours >= 1 AND delay_hours <= 720),
  message_template text NOT NULL DEFAULT E'Olá, {nome_cliente}! 😊\n\nPassando para saber se conseguiu analisar o orçamento que enviamos.\n\nCaso tenha alguma dúvida ou queira fazer alguma alteração, estou à disposição!',
  whatsapp_template_name text NOT NULL DEFAULT 'orcamento_followup',
  whatsapp_template_lang text NOT NULL DEFAULT 'pt_BR',
  send_window_start time NOT NULL DEFAULT '08:00',
  send_window_end time NOT NULL DEFAULT '18:00',
  business_days_only boolean NOT NULL DEFAULT true,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_followup_settings TO authenticated;
GRANT ALL ON public.quote_followup_settings TO service_role;

ALTER TABLE public.quote_followup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own followup settings"
  ON public.quote_followup_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_quote_followup_settings_updated_at
  BEFORE UPDATE ON public.quote_followup_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Histórico de follow-up
CREATE TABLE IF NOT EXISTS public.quote_followup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  message_rendered text,
  status text NOT NULL CHECK (status IN ('success','error','skipped')),
  error_message text,
  whatsapp_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_followup_logs_quote_idx ON public.quote_followup_logs (quote_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS quote_followup_logs_user_idx ON public.quote_followup_logs (user_id, sent_at DESC);

GRANT SELECT ON public.quote_followup_logs TO authenticated;
GRANT ALL ON public.quote_followup_logs TO service_role;

ALTER TABLE public.quote_followup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own followup logs"
  ON public.quote_followup_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. RPC: marcar orçamento como enviado (idempotente) e agendar follow-up
CREATE OR REPLACE FUNCTION public.mark_quote_sent(p_quote_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote RECORD;
  v_settings RECORD;
  v_delay integer;
  v_enabled boolean;
BEGIN
  SELECT id, user_id, sent_at, status
    INTO v_quote
  FROM public.quotes
  WHERE id = p_quote_id
  LIMIT 1;

  IF v_quote.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_found');
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> v_quote.user_id THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_quote.sent_at IS NOT NULL THEN
    RETURN json_build_object('success', true, 'already', true);
  END IF;

  SELECT enabled, delay_hours INTO v_settings
  FROM public.quote_followup_settings WHERE user_id = v_quote.user_id;

  v_enabled := COALESCE(v_settings.enabled, true);
  v_delay := COALESCE(v_settings.delay_hours, 24);

  UPDATE public.quotes
     SET sent_at = now(),
         followup_scheduled_at = CASE
           WHEN v_enabled AND v_quote.status = 'pending'
             THEN now() + (v_delay || ' hours')::interval
           ELSE NULL
         END,
         updated_at = now()
   WHERE id = p_quote_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 5. RPC: marcar cliente como respondido (cancela follow-up)
CREATE OR REPLACE FUNCTION public.mark_quote_client_responded(p_quote_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.quotes WHERE id = p_quote_id;
  IF v_owner IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_found');
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> v_owner THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  UPDATE public.quotes
     SET client_responded_at = now(),
         followup_scheduled_at = NULL,
         updated_at = now()
   WHERE id = p_quote_id;

  RETURN json_build_object('success', true);
END;
$$;
