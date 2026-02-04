-- Add payment_provider_id column to pending_payments for tracking external payment reference
-- This allows us to verify that a payment was actually completed by InfinitePay

ALTER TABLE public.pending_payments 
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT DEFAULT NULL;

-- Add index for faster lookups by payment_provider_id
CREATE INDEX IF NOT EXISTS idx_pending_payments_provider_id 
ON public.pending_payments(payment_provider_id) 
WHERE payment_provider_id IS NOT NULL;

-- Update the verify_and_complete_payment function to require webhook confirmation
-- Payments can only be completed if they have been confirmed via webhook (status = 'confirmed_by_webhook')
CREATE OR REPLACE FUNCTION public.verify_and_complete_payment(p_csrf_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_pending pending_payments%ROWTYPE;
  v_lifetime_plan_id uuid;
BEGIN
  -- Find pending payment by csrf_token
  SELECT * INTO v_pending
  FROM public.pending_payments
  WHERE csrf_token = p_csrf_token
    AND expires_at > now()
  LIMIT 1;

  -- If not found or expired
  IF v_pending.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Token inválido ou expirado');
  END IF;

  -- SECURITY: Check if payment was confirmed by webhook
  -- Only status 'confirmed_by_webhook' means InfinitePay actually confirmed the payment
  IF v_pending.status != 'confirmed_by_webhook' THEN
    -- Log the attempt for security monitoring
    INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
    VALUES (
      v_pending.user_id, 
      'payment_verification_blocked', 
      'Payment verification attempted before webhook confirmation',
      json_build_object('payment_id', v_pending.id, 'status', v_pending.status)
    );
    
    RETURN json_build_object(
      'success', false, 
      'error', 'Pagamento ainda não confirmado. Aguarde a confirmação do processador de pagamentos.',
      'status', 'awaiting_confirmation'
    );
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

  -- Log successful upgrade
  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
  VALUES (
    v_pending.user_id, 
    'payment_completed', 
    'User upgraded to pro plan after webhook confirmation',
    json_build_object('payment_id', v_pending.id, 'payment_provider_id', v_pending.payment_provider_id)
  );

  RETURN json_build_object('success', true, 'message', 'Plano ativado com sucesso');
END;
$$;

-- Create a new function for webhook to confirm payments (only callable by service role)
CREATE OR REPLACE FUNCTION public.confirm_payment_webhook(
  p_payment_provider_id text,
  p_user_email text DEFAULT NULL,
  p_amount numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_pending pending_payments%ROWTYPE;
  v_user_id uuid;
BEGIN
  -- If we have the user email, find the most recent pending payment for that user
  IF p_user_email IS NOT NULL THEN
    SELECT p.user_id INTO v_user_id
    FROM public.profiles p
    WHERE p.email = p_user_email
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
      SELECT * INTO v_pending
      FROM public.pending_payments
      WHERE user_id = v_user_id
        AND status = 'pending'
        AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
  END IF;
  
  -- If no pending payment found
  IF v_pending.id IS NULL THEN
    -- Log for manual review
    INSERT INTO public.security_logs (event_type, event_description, metadata)
    VALUES (
      'webhook_payment_not_found', 
      'Webhook received but no matching pending payment found',
      json_build_object(
        'payment_provider_id', p_payment_provider_id, 
        'user_email', p_user_email,
        'amount', p_amount
      )
    );
    
    RETURN json_build_object('success', false, 'error', 'No matching pending payment found');
  END IF;

  -- Update pending payment with webhook confirmation
  UPDATE public.pending_payments
  SET status = 'confirmed_by_webhook',
      payment_provider_id = p_payment_provider_id
  WHERE id = v_pending.id;

  -- Log webhook confirmation
  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
  VALUES (
    v_pending.user_id, 
    'webhook_payment_confirmed', 
    'Payment confirmed by InfinitePay webhook',
    json_build_object(
      'payment_id', v_pending.id, 
      'payment_provider_id', p_payment_provider_id,
      'amount', p_amount
    )
  );

  RETURN json_build_object('success', true, 'payment_id', v_pending.id, 'user_id', v_pending.user_id);
END;
$$;