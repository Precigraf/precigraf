
CREATE TABLE IF NOT EXISTS public.whatsapp_integrations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  waba_id text NOT NULL,
  phone_number_id text NOT NULL,
  business_name text,
  phone_display text,
  access_token text NOT NULL,
  token_type text NOT NULL DEFAULT 'system_user',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','error')),
  last_error text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.whatsapp_integrations TO authenticated;
GRANT ALL ON public.whatsapp_integrations TO service_role;

ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own whatsapp integration"
  ON public.whatsapp_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own whatsapp integration"
  ON public.whatsapp_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT/UPDATE apenas via edge function (service_role)

CREATE TRIGGER update_whatsapp_integrations_updated_at
  BEFORE UPDATE ON public.whatsapp_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View pública (sem token) para o frontend
CREATE OR REPLACE VIEW public.whatsapp_integration_status AS
SELECT user_id, waba_id, phone_number_id, business_name, phone_display,
       status, last_error, connected_at, updated_at
FROM public.whatsapp_integrations;

GRANT SELECT ON public.whatsapp_integration_status TO authenticated;
