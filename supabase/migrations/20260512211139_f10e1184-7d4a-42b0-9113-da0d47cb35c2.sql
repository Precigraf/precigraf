-- Recreate view without expiry_date logic
DROP VIEW IF EXISTS public.supply_low_stock;

CREATE VIEW public.supply_low_stock
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.user_id,
  s.name,
  s.type,
  s.unit,
  s.quantity,
  s.min_alert,
  s.unit_cost,
  s.expiry_date,
  CASE
    WHEN s.quantity = 0            THEN 'out_of_stock'
    WHEN s.quantity <= s.min_alert THEN 'low'
  END AS alert_type
FROM public.supply_stock s
WHERE s.is_active = true
  AND s.min_alert > 0
  AND s.quantity <= s.min_alert;