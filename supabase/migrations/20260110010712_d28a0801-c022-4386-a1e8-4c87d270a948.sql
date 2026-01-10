-- Add is_favorite column to calculations table
ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Create index for faster queries on favorites
CREATE INDEX IF NOT EXISTS idx_calculations_is_favorite ON public.calculations(is_favorite DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_product_name ON public.calculations USING gin(to_tsvector('portuguese', product_name));