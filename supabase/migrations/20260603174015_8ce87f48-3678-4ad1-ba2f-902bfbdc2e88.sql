
-- ============ catalog_settings ============
CREATE TABLE public.catalog_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  whatsapp_message_template text NOT NULL DEFAULT 'Olá {loja}! Quero fazer um pedido:

{itens}

Total: {total}',
  primary_color text NOT NULL DEFAULT '#534AB7',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_settings_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_settings TO authenticated;
GRANT ALL ON public.catalog_settings TO service_role;

ALTER TABLE public.catalog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own catalog_settings" ON public.catalog_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_catalog_settings_updated
  BEFORE UPDATE ON public.catalog_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ catalog_banners ============
CREATE TABLE public.catalog_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eyebrow text,
  title text NOT NULL,
  subtitle text,
  bg_color text NOT NULL DEFAULT '#26215C',
  cta_label text,
  cta_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_banners_user ON public.catalog_banners(user_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_banners TO authenticated;
GRANT ALL ON public.catalog_banners TO service_role;

ALTER TABLE public.catalog_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own banners" ON public.catalog_banners
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_catalog_banners_updated
  BEFORE UPDATE ON public.catalog_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ catalog_featured ============
CREATE TABLE public.catalog_featured (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  badge text CHECK (badge IN ('promo','new')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_catalog_featured_user ON public.catalog_featured(user_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_featured TO authenticated;
GRANT ALL ON public.catalog_featured TO service_role;

ALTER TABLE public.catalog_featured ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own featured" ON public.catalog_featured
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_catalog_featured_updated
  BEFORE UPDATE ON public.catalog_featured
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Public RPC ============
CREATE OR REPLACE FUNCTION public.get_public_catalog(p_slug text)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_result json;
BEGIN
  SELECT * INTO v_settings FROM public.catalog_settings WHERE slug = p_slug AND is_active = true LIMIT 1;
  IF v_settings.user_id IS NULL THEN
    RETURN json_build_object('error','not_found');
  END IF;

  SELECT json_build_object(
    'store', (
      SELECT json_build_object(
        'name', COALESCE(NULLIF(p.store_name,''), NULLIF(p.company_name,''), 'Loja'),
        'logo_url', p.logo_url,
        'whatsapp', p.whatsapp,
        'primary_color', v_settings.primary_color,
        'whatsapp_message_template', v_settings.whatsapp_message_template
      )
      FROM public.profiles p WHERE p.user_id = v_settings.user_id
    ),
    'banners', COALESCE((
      SELECT json_agg(json_build_object(
        'id', b.id,
        'eyebrow', b.eyebrow,
        'title', b.title,
        'subtitle', b.subtitle,
        'bg_color', b.bg_color,
        'cta_label', b.cta_label,
        'cta_url', b.cta_url
      ) ORDER BY b.sort_order, b.created_at)
      FROM public.catalog_banners b
      WHERE b.user_id = v_settings.user_id AND b.is_active = true
    ), '[]'::json),
    'categories', COALESCE((
      SELECT json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
      FROM public.product_categories c WHERE c.user_id = v_settings.user_id
    ), '[]'::json),
    'products', COALESCE((
      SELECT json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'size', p.size,
        'material', p.material,
        'finish', p.finish,
        'production_time', p.production_time,
        'unit_price', p.unit_price,
        'default_quantity', p.default_quantity,
        'price_tiers', COALESCE(p.price_tiers, '[]'::jsonb),
        'category_id', p.category_id,
        'badge', f.badge,
        'sort_order', COALESCE(f.sort_order, 999999)
      ) ORDER BY COALESCE(f.sort_order, 999999), p.name)
      FROM public.products p
      LEFT JOIN public.catalog_featured f
        ON f.product_id = p.id AND f.user_id = v_settings.user_id AND f.is_active = true
      WHERE p.user_id = v_settings.user_id AND p.is_active = true
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_catalog(text) TO anon, authenticated;
