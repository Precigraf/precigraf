-- Adicionar políticas explícitas de bloqueio para garantir segurança completa

-- 1. Security logs - Imutáveis (nunca podem ser alterados ou deletados)
CREATE POLICY "No update to security logs"
ON public.security_logs
FOR UPDATE
USING (false);

CREATE POLICY "No delete from security logs"
ON public.security_logs
FOR DELETE
USING (false);

-- 2. Device fingerprints - Imutáveis (prevenir manipulação)
CREATE POLICY "No update to device fingerprints"
ON public.device_fingerprints
FOR UPDATE
USING (false);

CREATE POLICY "No delete from device fingerprints"
ON public.device_fingerprints
FOR DELETE
USING (false);

-- 3. Subscription plans - Apenas admins podem modificar (via migrations)
CREATE POLICY "No insert to subscription plans"
ON public.subscription_plans
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No update to subscription plans"
ON public.subscription_plans
FOR UPDATE
USING (false);

CREATE POLICY "No delete from subscription plans"
ON public.subscription_plans
FOR DELETE
USING (false);