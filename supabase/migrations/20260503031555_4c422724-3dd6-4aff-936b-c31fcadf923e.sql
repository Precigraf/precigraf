
-- 1) Restrict verify_and_complete_payment to webhook-confirmed payments only
CREATE OR REPLACE FUNCTION public.verify_and_complete_payment(p_csrf_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pending pending_payments%ROWTYPE;
  v_lifetime_plan_id uuid;
BEGIN
  SELECT * INTO v_pending
  FROM public.pending_payments
  WHERE csrf_token = p_csrf_token
    AND expires_at > now()
  LIMIT 1;

  IF v_pending.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid request');
  END IF;

  IF v_pending.status = 'completed' THEN
    RETURN json_build_object('success', true, 'message', 'Plano já está ativo');
  END IF;

  -- Only accept webhook-confirmed payments
  IF v_pending.status <> 'confirmed_by_webhook' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Pagamento não confirmado pelo provedor.',
      'status', 'awaiting_confirmation'
    );
  END IF;

  SELECT id INTO v_lifetime_plan_id
  FROM public.subscription_plans
  WHERE name = 'lifetime'
  LIMIT 1;

  IF v_lifetime_plan_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Internal error');
  END IF;

  UPDATE public.profiles
  SET plan_id = v_lifetime_plan_id,
      updated_at = now()
  WHERE user_id = v_pending.user_id;

  UPDATE public.pending_payments
  SET status = 'completed',
      completed_at = now()
  WHERE id = v_pending.id
    AND status = 'confirmed_by_webhook';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payment already processed');
  END IF;

  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
  VALUES (
    v_pending.user_id,
    'payment_completed',
    'User upgraded to pro plan',
    json_build_object('payment_id', v_pending.id, 'payment_provider_id', v_pending.payment_provider_id)
  );

  RETURN json_build_object('success', true, 'message', 'Plano ativado com sucesso');
END;
$function$;

-- 2) Restrict pending_payments INSERT so users can't set status to a privileged value
DROP POLICY IF EXISTS "Users can create their own pending payments" ON public.pending_payments;
CREATE POLICY "Users can create their own pending payments"
ON public.pending_payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 3) Restrict security_logs INSERT to authenticated users only (no NULL user_id pollution)
DROP POLICY IF EXISTS "Users can insert own security logs" ON public.security_logs;
CREATE POLICY "Users can insert own security logs"
ON public.security_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
