CREATE TABLE public.price_catalogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Novo catálogo',
  template_id text NOT NULL DEFAULT 'classic-01',
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_catalogs TO authenticated;
GRANT ALL ON public.price_catalogs TO service_role;

ALTER TABLE public.price_catalogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own price catalogs"
  ON public.price_catalogs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price catalogs"
  ON public.price_catalogs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price catalogs"
  ON public.price_catalogs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price catalogs"
  ON public.price_catalogs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_price_catalogs_user ON public.price_catalogs(user_id, updated_at DESC);

CREATE TRIGGER update_price_catalogs_updated_at
  BEFORE UPDATE ON public.price_catalogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();