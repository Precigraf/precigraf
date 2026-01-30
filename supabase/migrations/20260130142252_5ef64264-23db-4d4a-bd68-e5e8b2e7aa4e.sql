-- Restringir acesso aos security logs apenas para admins
-- Usuários não devem ver detalhes de monitoramento de segurança

DROP POLICY IF EXISTS "Users can view own security logs" ON public.security_logs;

-- Apenas admins podem ver logs de segurança
CREATE POLICY "Admins can view all security logs"
ON public.security_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));