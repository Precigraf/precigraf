-- Catálogo de materiais
CREATE TABLE public.inventory_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unidade',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own materials" ON public.inventory_materials
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own materials" ON public.inventory_materials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own materials" ON public.inventory_materials
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own materials" ON public.inventory_materials
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_inventory_materials_updated_at
  BEFORE UPDATE ON public.inventory_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Movimentações (imutáveis)
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  material_id UUID NOT NULL REFERENCES public.inventory_materials(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  notes TEXT,
  reference_type TEXT CHECK (reference_type IN ('purchase', 'order', 'manual')),
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_material ON public.inventory_movements(material_id, created_at DESC);
CREATE INDEX idx_inventory_movements_user ON public.inventory_movements(user_id, created_at DESC);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own movements" ON public.inventory_movements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own movements" ON public.inventory_movements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "No update of movements" ON public.inventory_movements
  FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No delete of movements" ON public.inventory_movements
  FOR DELETE TO authenticated USING (false);

-- Trigger para atualizar estoque atomicamente
CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.inventory_materials
  SET current_stock = current_stock + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.material_id AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER apply_inventory_movement_trigger
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

-- Composição dos produtos
CREATE TABLE public.product_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.inventory_materials(id) ON DELETE CASCADE,
  quantity_per_unit NUMERIC NOT NULL CHECK (quantity_per_unit > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, material_id)
);

CREATE INDEX idx_product_materials_product ON public.product_materials(product_id);

ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product materials" ON public.product_materials
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own product materials" ON public.product_materials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own product materials" ON public.product_materials
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own product materials" ON public.product_materials
  FOR DELETE TO authenticated USING (auth.uid() = user_id);