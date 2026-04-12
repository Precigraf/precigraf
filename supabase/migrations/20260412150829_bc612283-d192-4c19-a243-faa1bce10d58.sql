
-- 1. Clients table
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  whatsapp text,
  cpf text,
  cep text,
  address text,
  neighborhood text,
  address_number text,
  landmark text,
  city text,
  state text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Quotes table
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  calculation_id uuid REFERENCES public.calculations(id) ON DELETE SET NULL,
  description text,
  product_name text,
  total_value numeric NOT NULL,
  unit_value numeric,
  quantity integer,
  status text NOT NULL DEFAULT 'pending',
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes" ON public.quotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'approved',
  kanban_position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own orders" ON public.orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 4. Order status history
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  old_status text,
  new_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order history" ON public.order_status_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own order history" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
