
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
    -- Compute total_cost from items + products
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

ALTER TABLE public.quotes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
