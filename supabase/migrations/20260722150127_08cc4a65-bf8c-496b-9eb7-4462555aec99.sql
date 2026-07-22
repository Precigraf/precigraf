
DROP VIEW IF EXISTS public.whatsapp_integration_status;
CREATE VIEW public.whatsapp_integration_status
WITH (security_invoker=true) AS
SELECT user_id, waba_id, phone_number_id, business_name, phone_display,
       status, last_error, connected_at, updated_at
FROM public.whatsapp_integrations;

GRANT SELECT ON public.whatsapp_integration_status TO authenticated;
