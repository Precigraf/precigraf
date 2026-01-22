-- Create table to store pending payment tokens securely
CREATE TABLE public.pending_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  csrf_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- Users can only view their own pending payments
CREATE POLICY "Users can view their own pending payments"
ON public.pending_payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own pending payments
CREATE POLICY "Users can create their own pending payments"
ON public.pending_payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_pending_payments_csrf_token ON public.pending_payments(csrf_token);
CREATE INDEX idx_pending_payments_user_id ON public.pending_payments(user_id);

-- Function to verify and complete payment (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.verify_and_complete_payment(p_csrf_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending pending_payments%ROWTYPE;
  v_lifetime_plan_id uuid;
  v_result json;
BEGIN
  -- Find pending payment by csrf_token
  SELECT * INTO v_pending
  FROM public.pending_payments
  WHERE csrf_token = p_csrf_token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  -- If not found or expired
  IF v_pending.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Token inválido ou expirado');
  END IF;

  -- Get lifetime plan ID
  SELECT id INTO v_lifetime_plan_id
  FROM public.subscription_plans
  WHERE name = 'lifetime'
  LIMIT 1;

  -- Update user's profile to lifetime plan
  UPDATE public.profiles
  SET plan = 'pro',
      plan_id = COALESCE(v_lifetime_plan_id, plan_id),
      updated_at = now()
  WHERE user_id = v_pending.user_id;

  -- Mark payment as completed
  UPDATE public.pending_payments
  SET status = 'completed',
      completed_at = now()
  WHERE id = v_pending.id;

  RETURN json_build_object('success', true, 'message', 'Plano ativado com sucesso');
END;
$$;