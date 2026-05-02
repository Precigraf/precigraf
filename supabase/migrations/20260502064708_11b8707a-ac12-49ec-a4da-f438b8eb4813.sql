ALTER TABLE public.calculations ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.calculations ADD COLUMN IF NOT EXISTS product_id uuid;