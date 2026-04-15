
-- Add customization fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS system_color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Add company info fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_document text,
  ADD COLUMN IF NOT EXISTS company_phone text,
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS company_address_number text,
  ADD COLUMN IF NOT EXISTS company_neighborhood text,
  ADD COLUMN IF NOT EXISTS company_city text,
  ADD COLUMN IF NOT EXISTS company_state text,
  ADD COLUMN IF NOT EXISTS company_cep text;
