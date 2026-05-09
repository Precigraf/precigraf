
-- ============================================
-- SUPPLY STOCK TABLES
-- ============================================

CREATE TABLE public.supply_stock (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL,
  name            TEXT        NOT NULL,
  type            TEXT        NOT NULL CHECK (type IN ('paper', 'ink', 'other')),
  unit            TEXT        NOT NULL DEFAULT 'un',
  quantity        NUMERIC     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_cost       NUMERIC     NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  min_alert       NUMERIC     NOT NULL DEFAULT 0 CHECK (min_alert >= 0),
  expiry_date     DATE,
  notes           TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.supply_movements (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  supply_id   UUID        NOT NULL REFERENCES public.supply_stock(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('in', 'out')),
  quantity    NUMERIC     NOT NULL CHECK (quantity > 0),
  unit_cost   NUMERIC,
  reason      TEXT,
  order_id    UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.product_supplies (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID        NOT NULL,
  product_id         UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supply_id          UUID        NOT NULL REFERENCES public.supply_stock(id) ON DELETE CASCADE,
  quantity_per_unit  NUMERIC     NOT NULL CHECK (quantity_per_unit > 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, supply_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_supply_stock_user_id     ON public.supply_stock(user_id);
CREATE INDEX idx_supply_stock_type        ON public.supply_stock(type);
CREATE INDEX idx_supply_movements_supply  ON public.supply_movements(supply_id);
CREATE INDEX idx_supply_movements_user    ON public.supply_movements(user_id);
CREATE INDEX idx_supply_movements_order   ON public.supply_movements(order_id);
CREATE INDEX idx_product_supplies_product ON public.product_supplies(product_id);
CREATE INDEX idx_product_supplies_user    ON public.product_supplies(user_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.supply_stock     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supply_stock_select" ON public.supply_stock FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "supply_stock_insert" ON public.supply_stock FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "supply_stock_update" ON public.supply_stock FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "supply_stock_delete" ON public.supply_stock FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "supply_movements_select" ON public.supply_movements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "supply_movements_insert" ON public.supply_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_supplies_select" ON public.product_supplies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "product_supplies_insert" ON public.product_supplies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "product_supplies_update" ON public.product_supplies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "product_supplies_delete" ON public.product_supplies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- updated_at trigger (reuse existing function)
-- ============================================
CREATE TRIGGER supply_stock_updated_at
  BEFORE UPDATE ON public.supply_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- consume_supply - records movement automatically
-- ============================================
CREATE OR REPLACE FUNCTION public.consume_supply(
  p_supply_id UUID,
  p_quantity  NUMERIC,
  p_order_id  UUID DEFAULT NULL,
  p_reason    TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_current NUMERIC;
  v_to_consume NUMERIC;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;

  SELECT user_id, quantity INTO v_user_id, v_current
  FROM public.supply_stock WHERE id = p_supply_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'supply not found';
  END IF;

  IF auth.uid() IS NOT NULL AND v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  -- Never go negative; cap to current available
  v_to_consume := LEAST(p_quantity, v_current);

  IF v_to_consume > 0 THEN
    UPDATE public.supply_stock
       SET quantity = quantity - v_to_consume
     WHERE id = p_supply_id;

    INSERT INTO public.supply_movements(supply_id, user_id, type, quantity, reason, order_id)
    VALUES (p_supply_id, v_user_id, 'out', v_to_consume, p_reason, p_order_id);
  END IF;

  -- If the requested quantity exceeded available, notify
  IF p_quantity > v_current THEN
    PERFORM public.create_notification(
      v_user_id,
      'supply_insufficient',
      'Estoque insuficiente',
      'Faltam ' || (p_quantity - v_current)::text || ' un. de um insumo no pedido.',
      '/estoque',
      jsonb_build_object('supply_id', p_supply_id, 'order_id', p_order_id, 'requested', p_quantity, 'available', v_current)
    );
  END IF;
END;
$$;

-- ============================================
-- restock_supply
-- ============================================
CREATE OR REPLACE FUNCTION public.restock_supply(
  p_supply_id UUID,
  p_quantity  NUMERIC,
  p_unit_cost NUMERIC DEFAULT NULL,
  p_reason    TEXT    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_user_id UUID;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;

  SELECT user_id INTO v_user_id FROM public.supply_stock WHERE id = p_supply_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'supply not found'; END IF;
  IF auth.uid() IS NOT NULL AND v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  UPDATE public.supply_stock
     SET quantity = quantity + p_quantity,
         unit_cost = COALESCE(p_unit_cost, unit_cost)
   WHERE id = p_supply_id;

  INSERT INTO public.supply_movements(supply_id, user_id, type, quantity, unit_cost, reason)
  VALUES (p_supply_id, v_user_id, 'in', p_quantity, p_unit_cost, p_reason);
END;
$$;

-- ============================================
-- consume_supplies_for_order
-- ============================================
CREATE OR REPLACE FUNCTION public.consume_supplies_for_order(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_quote RECORD;
  v_item jsonb;
  v_qty numeric;
  v_product_id uuid;
  v_link RECORD;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN RETURN; END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE id = v_order.quote_id;
  IF v_quote.id IS NULL THEN RETURN; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_quote.items, '[]'::jsonb))
  LOOP
    v_qty := COALESCE((v_item->>'quantity')::numeric, 0);
    v_product_id := NULLIF(v_item->>'product_id','')::uuid;
    IF v_product_id IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;

    FOR v_link IN
      SELECT supply_id, quantity_per_unit
      FROM public.product_supplies
      WHERE product_id = v_product_id AND user_id = v_order.user_id
    LOOP
      PERFORM public.consume_supply(
        v_link.supply_id,
        v_link.quantity_per_unit * v_qty,
        p_order_id,
        'Pedido #' || COALESCE(v_order.order_number::text, p_order_id::text)
      );
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================
-- Notification trigger when crossing min_alert
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_supply_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_active
     AND NEW.min_alert > 0
     AND OLD.quantity > NEW.min_alert
     AND NEW.quantity <= NEW.min_alert THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'supply_low_stock',
      'Estoque baixo: ' || NEW.name,
      'Quantidade atual: ' || NEW.quantity::text || ' ' || NEW.unit || ' (mínimo ' || NEW.min_alert::text || ')',
      '/estoque',
      jsonb_build_object('supply_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER supply_stock_low_alert
  AFTER UPDATE OF quantity ON public.supply_stock
  FOR EACH ROW EXECUTE FUNCTION public.notify_supply_low_stock();

-- ============================================
-- View: supply_low_stock (security_invoker)
-- ============================================
CREATE OR REPLACE VIEW public.supply_low_stock
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.user_id,
  s.name,
  s.type,
  s.unit,
  s.quantity,
  s.min_alert,
  s.unit_cost,
  s.expiry_date,
  CASE
    WHEN s.quantity = 0 THEN 'out_of_stock'
    WHEN s.min_alert > 0 AND s.quantity <= s.min_alert THEN 'low'
    WHEN s.expiry_date IS NOT NULL AND s.expiry_date <= CURRENT_DATE + 30 THEN 'expiring_soon'
  END AS alert_type
FROM public.supply_stock s
WHERE s.is_active = true
  AND (
    s.quantity = 0
    OR (s.min_alert > 0 AND s.quantity <= s.min_alert)
    OR (s.expiry_date IS NOT NULL AND s.expiry_date <= CURRENT_DATE + 30)
  );

-- ============================================
-- Update respond_to_quote_by_token to consume supplies
-- ============================================
CREATE OR REPLACE FUNCTION public.respond_to_quote_by_token(p_token uuid, p_action text, p_comment text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_quote RECORD;
  v_existing UUID;
  v_order_id UUID;
  v_total_cost numeric := 0;
  v_item jsonb;
  v_product RECORD;
  v_qty numeric;
  v_tier_cost numeric;
  v_unit_cost numeric;
BEGIN
  IF p_action NOT IN ('approved','changes_requested','rejected') THEN
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
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_quote.items, '[]'::jsonb))
    LOOP
      v_qty := COALESCE((v_item->>'quantity')::numeric, 0);
      IF (v_item->>'product_id') IS NOT NULL AND v_qty > 0 THEN
        SELECT cost, default_quantity, price_tiers INTO v_product
        FROM public.products WHERE id = (v_item->>'product_id')::uuid LIMIT 1;
        IF FOUND THEN
          v_tier_cost := NULL;
          SELECT (t->>'cost')::numeric INTO v_tier_cost
          FROM jsonb_array_elements(COALESCE(v_product.price_tiers, '[]'::jsonb)) t
          WHERE (t->>'quantity')::numeric = v_qty
          LIMIT 1;
          IF v_tier_cost IS NOT NULL THEN
            v_total_cost := v_total_cost + v_tier_cost;
          ELSE
            v_unit_cost := COALESCE(v_product.cost, 0) / NULLIF(GREATEST(v_product.default_quantity, 1), 0);
            v_total_cost := v_total_cost + COALESCE(v_unit_cost, 0) * v_qty;
          END IF;
        END IF;
      END IF;
    END LOOP;
    v_total_cost := v_total_cost + COALESCE(v_quote.shipping_value, 0);

    UPDATE public.quotes SET status = 'approved', updated_at = now() WHERE id = v_quote.id;

    INSERT INTO public.orders(user_id, client_id, quote_id, status, total_revenue, total_cost, amount_pending)
    VALUES (v_quote.user_id, v_quote.client_id, v_quote.id, 'approved',
            COALESCE(v_quote.total_value, 0), v_total_cost, COALESCE(v_quote.total_value, 0))
    RETURNING id INTO v_order_id;

    INSERT INTO public.receivables(user_id, order_id, amount, due_date, installment_number, installment_total, status)
    VALUES (v_quote.user_id, v_order_id, COALESCE(v_quote.total_value, 0),
            (CURRENT_DATE + INTERVAL '7 days')::date, 1, 1, 'pendente');

    -- Consume supplies linked to products
    PERFORM public.consume_supplies_for_order(v_order_id);

    PERFORM public.create_notification(
      v_quote.user_id, 'quote_approved',
      'Orçamento aprovado pelo cliente',
      'O orçamento #' || COALESCE(v_quote.quote_number::text, '') || ' foi aprovado e um pedido foi criado.',
      '/pedidos',
      json_build_object('quote_id', v_quote.id, 'order_id', v_order_id)::jsonb
    );
  ELSIF p_action = 'rejected' THEN
    UPDATE public.quotes SET status = 'rejected', updated_at = now() WHERE id = v_quote.id;
    PERFORM public.create_notification(
      v_quote.user_id, 'quote_rejected',
      'Cliente recusou o orçamento',
      COALESCE(p_comment, 'Sem comentários adicionais'),
      '/orcamentos/' || v_quote.id::text,
      json_build_object('quote_id', v_quote.id)::jsonb
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
END;
$function$;
