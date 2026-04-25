
-- 1. DROP inventory module
DROP TABLE IF EXISTS public.product_materials CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.inventory_materials CASCADE;
DROP FUNCTION IF EXISTS public.apply_inventory_movement() CASCADE;

-- 2. Add whatsapp to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp text;

-- 3. Update handle_new_user to populate whatsapp + name
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
  VALUES (NEW.id, NEW.email, v_free_plan_id, NOW() + INTERVAL '2 days', v_whatsapp)
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

-- 4. Add order_number to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number integer;

CREATE OR REPLACE FUNCTION public.set_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max integer;
BEGIN
  IF NEW.order_number IS NULL THEN
    SELECT COALESCE(MAX(order_number), 0) + 1 INTO v_max
    FROM public.orders
    WHERE user_id = NEW.user_id;
    NEW.order_number := v_max;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();

-- Backfill existing orders
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
  FROM public.orders
  WHERE order_number IS NULL
)
UPDATE public.orders o
SET order_number = n.rn
FROM numbered n
WHERE o.id = n.id;
