-- Adicionar política SELECT vazia para rate_limits para silenciar linter
-- (Nenhum usuário pode ver, apenas funções SECURITY DEFINER)
CREATE POLICY "No direct access to rate_limits"
ON public.rate_limits
FOR SELECT
USING (false);

CREATE POLICY "No direct insert to rate_limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update to rate_limits"
ON public.rate_limits
FOR UPDATE
USING (false);

CREATE POLICY "No direct delete to rate_limits"
ON public.rate_limits
FOR DELETE
USING (false);