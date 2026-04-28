-- Função que envia broadcast quando o status do pedido muda
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_token IS NOT NULL AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'status', NEW.status,
        'updated_at', NEW.updated_at
      ),
      'status_change',
      'order:' || NEW.tracking_token,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger AFTER UPDATE em orders
DROP TRIGGER IF EXISTS trg_notify_order_status_change ON public.orders;
CREATE TRIGGER trg_notify_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();