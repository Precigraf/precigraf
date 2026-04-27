
-- 1) Add tracking_token column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;

-- 2) Backfill existing orders
UPDATE public.orders SET tracking_token = gen_random_uuid()::text WHERE tracking_token IS NULL;

-- 3) Make NOT NULL
ALTER TABLE public.orders ALTER COLUMN tracking_token SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN tracking_token SET DEFAULT gen_random_uuid()::text;

-- 4) Index
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);

-- 5) Public RPC function
CREATE OR REPLACE FUNCTION public.get_order_by_tracking_token(p_token TEXT)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'created_at', o.created_at,
    'client_name', c.name,
    'seller_name', COALESCE(NULLIF(p.company_name, ''), NULLIF(p.store_name, ''), 'Loja'),
    'items', COALESCE(
      (SELECT json_agg(json_build_object('name', item->>'name', 'quantity', (item->>'quantity')::numeric))
       FROM jsonb_array_elements(COALESCE(q.items, '[]'::jsonb)) item),
      '[]'::json
    )
  )
  INTO v_result
  FROM public.orders o
  LEFT JOIN public.clients c ON c.id = o.client_id
  LEFT JOIN public.quotes q ON q.id = o.quote_id
  LEFT JOIN public.profiles p ON p.user_id = o.user_id
  WHERE o.tracking_token = p_token
  LIMIT 1;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_tracking_token(TEXT) TO anon, authenticated;
