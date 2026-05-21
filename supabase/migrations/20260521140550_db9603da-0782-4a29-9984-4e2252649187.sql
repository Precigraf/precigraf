
-- 1) logo_scale on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS logo_scale numeric NOT NULL DEFAULT 1.0;

-- 2) expand supply_stock.type allowed values
ALTER TABLE public.supply_stock DROP CONSTRAINT IF EXISTS supply_stock_type_check;
ALTER TABLE public.supply_stock
  ADD CONSTRAINT supply_stock_type_check
  CHECK (type = ANY (ARRAY['paper'::text, 'ink'::text, 'handle'::text, 'packaging'::text, 'glue'::text, 'other'::text]));

-- 3) update get_quote_by_token to expose logo_scale
CREATE OR REPLACE FUNCTION public.get_quote_by_token(p_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'logo_scale', COALESCE(p.logo_scale, 1.0),
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
END; $function$;
