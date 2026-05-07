
-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at, created_at DESC);

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Helper to create notification (security definer so triggers/functions can create for any user)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID, p_type TEXT, p_title TEXT,
  p_body TEXT DEFAULT NULL, p_link TEXT DEFAULT NULL, p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_body, p_link, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- ============ QUOTES: public token + reminder ============
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS public_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_public_token ON public.quotes(public_token);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reminder_days INTEGER NOT NULL DEFAULT 5;

-- ============ QUOTE RESPONSES (public) ============
CREATE TABLE public.quote_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved','changes_requested')),
  comment TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_responses FORCE ROW LEVEL SECURITY;

CREATE INDEX idx_quote_responses_quote ON public.quote_responses(quote_id, created_at DESC);

CREATE POLICY "Owner views own quote responses"
  ON public.quote_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid()));

-- No direct inserts/updates/deletes; only via security definer function
CREATE POLICY "No direct insert quote_responses" ON public.quote_responses FOR INSERT TO public WITH CHECK (false);
CREATE POLICY "No direct update quote_responses" ON public.quote_responses FOR UPDATE TO public USING (false);
CREATE POLICY "No direct delete quote_responses" ON public.quote_responses FOR DELETE TO public USING (false);

-- ============ PUBLIC RPC: get quote by token ============
CREATE OR REPLACE FUNCTION public.get_quote_by_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', q.id,
    'quote_number', q.quote_number,
    'status', q.status,
    'product_name', q.product_name,
    'description', q.description,
    'items', COALESCE(q.items, '[]'::jsonb),
    'subtotal', q.subtotal,
    'discount_type', q.discount_type,
    'discount_value', q.discount_value,
    'shipping_value', q.shipping_value,
    'total_value', q.total_value,
    'unit_value', q.unit_value,
    'quantity', q.quantity,
    'valid_until', q.valid_until,
    'notes', q.notes,
    'created_at', q.created_at,
    'client', json_build_object(
      'name', c.name, 'email', c.email, 'whatsapp', c.whatsapp
    ),
    'seller', json_build_object(
      'company_name', COALESCE(NULLIF(p.company_name,''), NULLIF(p.store_name,''), 'Loja'),
      'company_email', p.company_email,
      'company_phone', p.company_phone,
      'logo_url', p.logo_url,
      'company_document', p.company_document
    ),
    'already_responded', EXISTS (SELECT 1 FROM public.quote_responses r WHERE r.quote_id = q.id)
  ) INTO v_result
  FROM public.quotes q
  LEFT JOIN public.clients c ON c.id = q.client_id
  LEFT JOIN public.profiles p ON p.user_id = q.user_id
  WHERE q.public_token = p_token
  LIMIT 1;
  RETURN v_result;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_quote_by_token(UUID) TO anon, authenticated;

-- ============ PUBLIC RPC: respond to quote ============
CREATE OR REPLACE FUNCTION public.respond_to_quote_by_token(
  p_token UUID, p_action TEXT, p_comment TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quote RECORD;
  v_existing UUID;
  v_order_id UUID;
BEGIN
  IF p_action NOT IN ('approved','changes_requested') THEN
    RETURN json_build_object('success', false, 'error', 'invalid_action');
  END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE public_token = p_token LIMIT 1;
  IF v_quote.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_found');
  END IF;

  SELECT id INTO v_existing FROM public.quote_responses WHERE quote_id = v_quote.id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'already_responded');
  END IF;

  INSERT INTO public.quote_responses(quote_id, action, comment)
  VALUES (v_quote.id, p_action, p_comment);

  IF p_action = 'approved' THEN
    UPDATE public.quotes SET status = 'aprovado', updated_at = now() WHERE id = v_quote.id;

    -- Create order automatically
    INSERT INTO public.orders(user_id, client_id, quote_id, status, total_revenue, total_cost, amount_pending)
    VALUES (v_quote.user_id, v_quote.client_id, v_quote.id, 'approved', COALESCE(v_quote.total_value,0), 0, COALESCE(v_quote.total_value,0))
    RETURNING id INTO v_order_id;

    PERFORM public.create_notification(
      v_quote.user_id, 'quote_approved',
      'Orçamento aprovado pelo cliente',
      'O orçamento #' || COALESCE(v_quote.quote_number::text, '') || ' foi aprovado e um pedido foi criado.',
      '/pedidos',
      json_build_object('quote_id', v_quote.id, 'order_id', v_order_id)::jsonb
    );
  ELSE
    UPDATE public.quotes SET status = 'ajustes_solicitados', updated_at = now() WHERE id = v_quote.id;
    PERFORM public.create_notification(
      v_quote.user_id, 'quote_changes_requested',
      'Cliente solicitou ajustes no orçamento',
      COALESCE(p_comment, 'Sem comentários adicionais'),
      '/orcamentos/' || v_quote.id::text,
      json_build_object('quote_id', v_quote.id)::jsonb
    );
  END IF;

  RETURN json_build_object('success', true, 'action', p_action);
END; $$;

GRANT EXECUTE ON FUNCTION public.respond_to_quote_by_token(UUID, TEXT, TEXT) TO anon, authenticated;

-- ============ FASE 3: RECEIVABLES ============
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','parcial','pago','atrasado')),
  installment_number INTEGER NOT NULL DEFAULT 1,
  installment_total INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables FORCE ROW LEVEL SECURITY;

CREATE INDEX idx_receivables_user_status ON public.receivables(user_id, status, due_date);

CREATE POLICY "Users view own receivables" ON public.receivables FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own receivables" ON public.receivables FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own receivables" ON public.receivables FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own receivables" ON public.receivables FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validate non-negative
CREATE OR REPLACE FUNCTION public.validate_receivable_values()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.amount < 0 OR NEW.amount_paid < 0 THEN
    RAISE EXCEPTION 'Values cannot be negative';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER validate_receivables BEFORE INSERT OR UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.validate_receivable_values();
