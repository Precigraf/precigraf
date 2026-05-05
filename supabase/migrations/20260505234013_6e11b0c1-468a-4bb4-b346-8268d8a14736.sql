
-- Messages table for ticket conversations
CREATE TABLE public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_role text NOT NULL DEFAULT 'user' CHECK (author_role IN ('user','admin')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stm_ticket_created ON public.support_ticket_messages(ticket_id, created_at);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: ticket owner OR admin
CREATE POLICY "View messages of own tickets or admin"
ON public.support_ticket_messages FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);

-- INSERT: ticket owner OR admin; user_id must be self
CREATE POLICY "Insert messages on own tickets or admin"
ON public.support_ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  )
);

-- No update / delete
CREATE POLICY "No update messages" ON public.support_ticket_messages FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No delete messages" ON public.support_ticket_messages FOR DELETE TO authenticated USING (false);

-- Trigger: set author_role and update parent ticket
CREATE OR REPLACE FUNCTION public.handle_new_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(NEW.user_id, 'admin'::app_role) THEN
    NEW.author_role := 'admin';
  ELSE
    NEW.author_role := 'user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stm_before_insert
BEFORE INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_ticket_message();

CREATE OR REPLACE FUNCTION public.after_ticket_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = now(),
      status = CASE
        WHEN NEW.author_role = 'admin' AND status = 'aberto' THEN 'em_andamento'
        ELSE status
      END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stm_after_insert
AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.after_ticket_message_insert();

-- Allow ticket owner to update their own ticket status (close/reopen)
CREATE POLICY "Owner can update own ticket"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
