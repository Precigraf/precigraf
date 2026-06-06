
ALTER TABLE public.catalog_settings
  ADD COLUMN IF NOT EXISTS template text NOT NULL DEFAULT 'catalog',
  ADD COLUMN IF NOT EXISTS header_bg_color text NOT NULL DEFAULT '#534AB7',
  ADD COLUMN IF NOT EXISTS header_text_color text NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS title_font text NOT NULL DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS title_weight text NOT NULL DEFAULT 'bold',
  ADD COLUMN IF NOT EXISTS body_font text NOT NULL DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS title_color text NOT NULL DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS price_color text NOT NULL DEFAULT '#534AB7',
  ADD COLUMN IF NOT EXISTS product_image_shape text NOT NULL DEFAULT 'square',
  ADD COLUMN IF NOT EXISTS product_border_style text NOT NULL DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS product_text_align text NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS product_name_case text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS product_buy_button text NOT NULL DEFAULT 'below',
  ADD COLUMN IF NOT EXISTS button_border_style text NOT NULL DEFAULT 'pill',
  ADD COLUMN IF NOT EXISTS button_bg_color text NOT NULL DEFAULT '#534AB7',
  ADD COLUMN IF NOT EXISTS button_text_color text NOT NULL DEFAULT '#FFFFFF';

ALTER TABLE public.catalog_banners
  ADD COLUMN IF NOT EXISTS image_mobile_url text,
  ADD COLUMN IF NOT EXISTS image_desktop_url text,
  ADD COLUMN IF NOT EXISTS storage_path_mobile text,
  ADD COLUMN IF NOT EXISTS storage_path_desktop text;

CREATE OR REPLACE FUNCTION public.get_public_catalog(p_slug text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        'whatsapp_message_template', v_settings.whatsapp_message_template,
        'template', v_settings.template,
        'header_bg_color', v_settings.header_bg_color,
        'header_text_color', v_settings.header_text_color,
        'title_font', v_settings.title_font,
        'title_weight', v_settings.title_weight,
        'body_font', v_settings.body_font,
        'title_color', v_settings.title_color,
        'price_color', v_settings.price_color,
        'product_image_shape', v_settings.product_image_shape,
        'product_border_style', v_settings.product_border_style,
        'product_text_align', v_settings.product_text_align,
        'product_name_case', v_settings.product_name_case,
        'product_buy_button', v_settings.product_buy_button,
        'button_border_style', v_settings.button_border_style,
        'button_bg_color', v_settings.button_bg_color,
        'button_text_color', v_settings.button_text_color
      )
      FROM public.profiles p WHERE p.user_id = v_settings.user_id
    ),
    'banners', COALESCE((
      SELECT json_agg(json_build_object(
        'id', b.id, 'eyebrow', b.eyebrow, 'title', b.title, 'subtitle', b.subtitle,
        'bg_color', b.bg_color, 'cta_label', b.cta_label, 'cta_url', b.cta_url,
        'image_mobile_url', b.image_mobile_url, 'image_desktop_url', b.image_desktop_url
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
END $function$;
