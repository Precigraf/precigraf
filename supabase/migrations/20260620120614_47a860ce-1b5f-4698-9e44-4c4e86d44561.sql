
-- 1) Trial 7 days
ALTER TABLE public.profiles ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_free_plan_id uuid;
  v_name text;
  v_whatsapp text;
BEGIN
  SELECT id INTO v_free_plan_id FROM public.subscription_plans WHERE name = 'free' LIMIT 1;
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_whatsapp := NEW.raw_user_meta_data->>'whatsapp';

  INSERT INTO public.profiles (user_id, email, plan_id, trial_ends_at, whatsapp)
  VALUES (NEW.id, NEW.email, v_free_plan_id, NOW() + INTERVAL '7 days', v_whatsapp)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.users (user_id, email, name, status)
  VALUES (NEW.id, NEW.email, v_name, 'ativo')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.security_logs (user_id, event_type, event_description)
  VALUES (NEW.id, 'user_created', 'New user account created');

  RETURN NEW;
END;
$function$;

-- Existing free users with active trial get +5 days (to match the new 7-day baseline)
UPDATE public.profiles p
SET trial_ends_at = trial_ends_at + interval '5 days'
FROM public.subscription_plans sp
WHERE sp.id = p.plan_id
  AND sp.name = 'free'
  AND p.trial_ends_at IS NOT NULL
  AND p.trial_ends_at > now();

-- 2) Supply categories
CREATE TABLE IF NOT EXISTS public.supply_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_categories TO authenticated;
GRANT ALL ON public.supply_categories TO service_role;

ALTER TABLE public.supply_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their supply categories"
ON public.supply_categories FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER supply_categories_updated_at
BEFORE UPDATE ON public.supply_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) supply_stock.category_id
ALTER TABLE public.supply_stock
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.supply_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_supply_stock_category_id ON public.supply_stock(category_id);
