
-- 1) portal_token nos clientes
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS portal_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS clients_portal_token_key ON public.clients(portal_token);

-- 2) tabela client_files
CREATE TABLE IF NOT EXISTS public.client_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  order_id uuid,
  uploaded_by text NOT NULL CHECK (uploaded_by IN ('client','owner')),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_files_user ON public.client_files(user_id);
CREATE INDEX IF NOT EXISTS idx_client_files_client ON public.client_files(client_id);
CREATE INDEX IF NOT EXISTS idx_client_files_order ON public.client_files(order_id);

ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views own client files" ON public.client_files
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner inserts own client files" ON public.client_files
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes own client files" ON public.client_files
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3) bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-portal', 'client-portal', false)
ON CONFLICT (id) DO NOTHING;

-- Owner can read/delete files inside their own folder ({user_id}/...)
CREATE POLICY "Owner reads own portal files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'client-portal' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner deletes own portal files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'client-portal' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner uploads to own portal folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-portal' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4) RPC: get_client_portal
CREATE OR REPLACE FUNCTION public.get_client_portal(p_token uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client RECORD;
  v_result json;
BEGIN
  SELECT * INTO v_client FROM public.clients WHERE portal_token = p_token LIMIT 1;
  IF v_client.id IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  SELECT json_build_object(
    'client', json_build_object(
      'id', v_client.id,
      'name', v_client.name,
      'email', v_client.email,
      'whatsapp', v_client.whatsapp,
      'city', v_client.city,
      'state', v_client.state
    ),
    'seller', (
      SELECT json_build_object(
        'company_name', COALESCE(NULLIF(p.company_name,''), NULLIF(p.store_name,''), 'Loja'),
        'company_email', p.company_email,
        'company_phone', p.company_phone,
        'whatsapp', p.whatsapp,
        'logo_url', p.logo_url,
        'pix_key', p.pix_key,
        'system_color', p.system_color
      )
      FROM public.profiles p WHERE p.user_id = v_client.user_id
    ),
    'orders', COALESCE((
      SELECT json_agg(json_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'status', o.status,
        'total_revenue', o.total_revenue,
        'amount_pending', o.amount_pending,
        'tracking_token', o.tracking_token,
        'created_at', o.created_at
      ) ORDER BY o.created_at DESC)
      FROM public.orders o WHERE o.client_id = v_client.id
    ), '[]'::json),
    'quotes', COALESCE((
      SELECT json_agg(json_build_object(
        'id', q.id,
        'quote_number', q.quote_number,
        'status', q.status,
        'product_name', q.product_name,
        'total_value', q.total_value,
        'public_token', q.public_token,
        'valid_until', q.valid_until,
        'created_at', q.created_at
      ) ORDER BY q.created_at DESC)
      FROM public.quotes q WHERE q.client_id = v_client.id
    ), '[]'::json),
    'receivables', COALESCE((
      SELECT json_agg(json_build_object(
        'id', r.id,
        'order_id', r.order_id,
        'order_number', o.order_number,
        'amount', r.amount,
        'amount_paid', r.amount_paid,
        'due_date', r.due_date,
        'paid_at', r.paid_at,
        'status', r.status,
        'installment_number', r.installment_number,
        'installment_total', r.installment_total
      ) ORDER BY r.due_date ASC)
      FROM public.receivables r
      JOIN public.orders o ON o.id = r.order_id
      WHERE o.client_id = v_client.id
    ), '[]'::json),
    'summary', (
      SELECT json_build_object(
        'orders_in_progress', COUNT(*) FILTER (WHERE o.status NOT IN ('entregue','concluido','cancelado')),
        'orders_done', COUNT(*) FILTER (WHERE o.status IN ('entregue','concluido')),
        'open_amount', COALESCE((
          SELECT SUM(r.amount - r.amount_paid)
          FROM public.receivables r
          JOIN public.orders o2 ON o2.id = r.order_id
          WHERE o2.client_id = v_client.id AND r.status <> 'pago'
        ), 0)
      )
      FROM public.orders o WHERE o.client_id = v_client.id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 5) RPC: list_client_portal_files (lista somente metadados; URLs assinadas vêm via edge function)
CREATE OR REPLACE FUNCTION public.list_client_portal_files(p_token uuid, p_order_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_id uuid;
  v_result json;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE portal_token = p_token LIMIT 1;
  IF v_client_id IS NULL THEN
    RETURN json_build_object('error','not_found');
  END IF;

  SELECT COALESCE(json_agg(json_build_object(
    'id', f.id,
    'order_id', f.order_id,
    'uploaded_by', f.uploaded_by,
    'file_name', f.file_name,
    'file_path', f.file_path,
    'file_size', f.file_size,
    'mime_type', f.mime_type,
    'created_at', f.created_at
  ) ORDER BY f.created_at DESC), '[]'::json) INTO v_result
  FROM public.client_files f
  WHERE f.client_id = v_client_id
    AND (p_order_id IS NULL OR f.order_id = p_order_id);

  RETURN v_result;
END;
$$;

-- 6) RPC: register_client_portal_upload (chamada pela edge function APÓS o upload no bucket)
CREATE OR REPLACE FUNCTION public.register_client_portal_upload(
  p_token uuid,
  p_order_id uuid,
  p_file_name text,
  p_file_path text,
  p_size bigint,
  p_mime text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client RECORD;
  v_id uuid;
BEGIN
  SELECT * INTO v_client FROM public.clients WHERE portal_token = p_token LIMIT 1;
  IF v_client.id IS NULL THEN
    RETURN json_build_object('success', false, 'error','not_found');
  END IF;

  IF p_order_id IS NOT NULL THEN
    PERFORM 1 FROM public.orders WHERE id = p_order_id AND client_id = v_client.id;
    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'invalid_order');
    END IF;
  END IF;

  INSERT INTO public.client_files(user_id, client_id, order_id, uploaded_by, file_name, file_path, file_size, mime_type)
  VALUES (v_client.user_id, v_client.id, p_order_id, 'client', p_file_name, p_file_path, COALESCE(p_size,0), p_mime)
  RETURNING id INTO v_id;

  PERFORM public.create_notification(
    v_client.user_id,
    'client_file_uploaded',
    'Cliente enviou um arquivo',
    v_client.name || ' enviou: ' || p_file_name,
    CASE WHEN p_order_id IS NOT NULL THEN '/pedidos' ELSE '/clientes' END,
    jsonb_build_object('client_id', v_client.id, 'order_id', p_order_id, 'file_id', v_id)
  );

  RETURN json_build_object('success', true, 'id', v_id);
END;
$$;

-- 7) RPC: get_client_portal_file_url (gera signed URL via storage; chamada pública pelo token)
CREATE OR REPLACE FUNCTION public.get_client_portal_file_meta(p_token uuid, p_file_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_id uuid;
  v_file RECORD;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE portal_token = p_token LIMIT 1;
  IF v_client_id IS NULL THEN
    RETURN json_build_object('error','not_found');
  END IF;

  SELECT * INTO v_file FROM public.client_files WHERE id = p_file_id AND client_id = v_client_id LIMIT 1;
  IF v_file.id IS NULL THEN
    RETURN json_build_object('error','not_found');
  END IF;

  RETURN json_build_object(
    'file_path', v_file.file_path,
    'file_name', v_file.file_name,
    'mime_type', v_file.mime_type
  );
END;
$$;
