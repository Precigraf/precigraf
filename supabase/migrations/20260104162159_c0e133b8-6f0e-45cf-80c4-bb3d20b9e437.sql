-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create calculations table
CREATE TABLE public.calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  cost_type TEXT NOT NULL DEFAULT 'lot',
  lot_quantity INTEGER NOT NULL DEFAULT 500,
  lot_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  paper_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  ink_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  varnish_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_material_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  energy_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  equipment_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  rent_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_operational_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  margin_percentage NUMERIC(5,2) NOT NULL DEFAULT 70,
  fixed_profit NUMERIC(12,2),
  total_cost NUMERIC(12,2) NOT NULL,
  profit NUMERIC(12,2) NOT NULL,
  sale_price NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on calculations
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- Calculations RLS policies
CREATE POLICY "Users can view their own calculations"
ON public.calculations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculations"
ON public.calculations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculations"
ON public.calculations FOR DELETE
USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();