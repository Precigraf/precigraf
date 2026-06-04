
-- ============ Catalog products (separados do calculador) ============
CREATE TABLE IF NOT EXISTS public.catalog_product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.catalog_product_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_product_categories TO authenticated;
GRANT ALL ON public.catalog_product_categories TO service_role;
ALTER TABLE public.catalog_product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own catalog categories" ON public.catalog_product_categories
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_catalog_product_categories_updated_at
  BEFORE UPDATE ON public.catalog_product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.catalog_product_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  promo_price numeric CHECK (promo_price IS NULL OR promo_price >= 0),
  stock integer,
  delivery_time text,
  delivery_notes text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_products TO authenticated;
GRANT ALL ON public.catalog_products TO service_role;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own catalog products" ON public.catalog_products
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_catalog_products_updated_at
  BEFORE UPDATE ON public.catalog_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.catalog_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_product_variants TO authenticated;
GRANT ALL ON public.catalog_product_variants TO service_role;
ALTER TABLE public.catalog_product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own catalog variants" ON public.catalog_product_variants
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.catalog_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  url text NOT NULL,
  storage_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_product_images TO authenticated;
GRANT ALL ON public.catalog_product_images TO service_role;
ALTER TABLE public.catalog_product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own catalog images" ON public.catalog_product_images
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Limite de 5 imagens por produto
CREATE OR REPLACE FUNCTION public.enforce_catalog_image_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.catalog_product_images WHERE product_id = NEW.product_id;
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Máximo de 5 imagens por produto';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_catalog_image_limit
  BEFORE INSERT ON public.catalog_product_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_catalog_image_limit();

-- ============ Storage policies para bucket catalog-images ============
-- SELECT público (catálogo é público)
CREATE POLICY "catalog images public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'catalog-images');

-- Dono pode inserir/atualizar/deletar (caminho começa com user_id/)
CREATE POLICY "catalog images owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "catalog images owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "catalog images owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'catalog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ Atualizar RPC pública do catálogo ============
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
        'id', b.id, 'eyebrow', b.eyebrow, 'title', b.title, 'subtitle', b.subtitle,
        'bg_color', b.bg_color, 'cta_label', b.cta_label, 'cta_url', b.cta_url
      ) ORDER BY b.sort_order, b.created_at)
      FROM public.catalog_banners b
      WHERE b.user_id = v_settings.user_id AND b.is_active = true
    ), '[]'::json),
    'categories', COALESCE((
      SELECT json_agg(json_build_object(
        'id', c.id, 'name', c.name, 'parent_id', c.parent_id
      ) ORDER BY c.sort_order, c.name)
      FROM public.catalog_product_categories c
      WHERE c.user_id = v_settings.user_id AND c.is_active = true
    ), '[]'::json),
    'products', COALESCE((
      SELECT json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'price', p.price,
        'promo_price', p.promo_price,
        'stock', p.stock,
        'delivery_time', p.delivery_time,
        'category_id', p.category_id,
        'is_featured', p.is_featured,
        'sort_order', p.sort_order,
        'images', COALESCE((
          SELECT json_agg(i.url ORDER BY i.sort_order, i.created_at)
          FROM public.catalog_product_images i WHERE i.product_id = p.id
        ), '[]'::json),
        'variants', COALESCE((
          SELECT json_agg(json_build_object(
            'id', v.id, 'name', v.name, 'price', v.price, 'stock', v.stock
          ) ORDER BY v.sort_order, v.created_at)
          FROM public.catalog_product_variants v WHERE v.product_id = p.id
        ), '[]'::json)
      ) ORDER BY p.is_featured DESC, p.sort_order, p.name)
      FROM public.catalog_products p
      WHERE p.user_id = v_settings.user_id AND p.is_active = true
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END $$;
