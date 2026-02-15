
-- Extend payment expiry from 1 hour to 24 hours
ALTER TABLE public.pending_payments ALTER COLUMN expires_at SET DEFAULT (now() + interval '24 hours');
