
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS infinitypay_url text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_marked_paid_at timestamptz;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_marked_paid_method text;

CREATE OR REPLACE FUNCTION public.get_quote_by_token(p_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSON;
  v_order RECORD;
  v_amount_received numeric := 0;
  v_amount_total numeric := 0;
BEGIN
  SELECT o.id, o.status, o.tracking_token, o.order_number, o.total_revenue, o.amount_received
    INTO v_order
  FROM public.orders o
  JOIN public.quotes q2 ON q2.id = o.quote_id
  WHERE q2.public_token = p_token
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF v_order.id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount_paid),0), COALESCE(SUM(amount),0)
      INTO v_amount_received, v_amount_total
    FROM public.receivables WHERE order_id = v_order.id;
  END IF;

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
    'client_marked_paid_at', q.client_marked_paid_at,
    'client_marked_paid_method', q.client_marked_paid_method,
    'client', json_build_object(
      'name', c.name, 'email', c.email, 'whatsapp', c.whatsapp
    ),
    'seller', json_build_object(
      'company_name', COALESCE(NULLIF(p.company_name,''), NULLIF(p.store_name,''), 'Loja'),
      'company_email', p.company_email,
      'company_phone', p.company_phone,
      'logo_url', p.logo_url,
      'logo_scale', COALESCE(p.logo_scale, 1.0),
      'company_document', p.company_document,
      'pix_key', p.pix_key,
      'infinitypay_url', p.infinitypay_url
    ),
    'order', CASE WHEN v_order.id IS NULL THEN NULL ELSE json_build_object(
      'id', v_order.id,
      'status', v_order.status,
      'tracking_token', v_order.tracking_token,
      'order_number', v_order.order_number,
      'total_revenue', v_order.total_revenue,
      'amount_received', v_amount_received,
      'amount_total', v_amount_total,
      'payment_confirmed', (v_amount_received > 0 AND v_amount_received >= v_amount_total)
    ) END,
    'already_responded', EXISTS (SELECT 1 FROM public.quote_responses r WHERE r.quote_id = q.id)
  ) INTO v_result
  FROM public.quotes q
  LEFT JOIN public.clients c ON c.id = q.client_id
  LEFT JOIN public.profiles p ON p.user_id = q.user_id
  WHERE q.public_token = p_token
  LIMIT 1;
  RETURN v_result;
END; $function$;

CREATE OR REPLACE FUNCTION public.mark_quote_paid_by_token(p_token uuid, p_method text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_quote RECORD;
BEGIN
  IF p_method NOT IN ('pix','infinitypay','outro') THEN
    RETURN json_build_object('success', false, 'error', 'invalid_method');
  END IF;

  SELECT id, user_id, quote_number, client_marked_paid_at
    INTO v_quote
  FROM public.quotes WHERE public_token = p_token LIMIT 1;

  IF v_quote.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_quote.client_marked_paid_at IS NOT NULL THEN
    RETURN json_build_object('success', true, 'already', true);
  END IF;

  UPDATE public.quotes
     SET client_marked_paid_at = now(),
         client_marked_paid_method = p_method,
         updated_at = now()
   WHERE id = v_quote.id;

  PERFORM public.create_notification(
    v_quote.user_id, 'payment_marked',
    'Cliente marcou pagamento como realizado',
    'Orçamento #' || COALESCE(v_quote.quote_number::text,'') || ' — método: ' || p_method || '. Confirme o recebimento no Financeiro.',
    '/financeiro',
    json_build_object('quote_id', v_quote.id, 'method', p_method)::jsonb
  );

  RETURN json_build_object('success', true);
END; $function$;
