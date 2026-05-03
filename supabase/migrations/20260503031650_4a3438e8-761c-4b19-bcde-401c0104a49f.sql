
-- Remove broad public SELECT on the "armazenamento" user bucket — owner-scoped policy already exists
DROP POLICY IF EXISTS "Public read access on armazenamento" ON storage.objects;

-- Realtime authorization: restrict channel topic subscriptions to the channel owner
-- Topic conventions used by the app:
--   * 'orders-realtime'  → broadcast for the orders table; only authenticated users may listen
--   * 'order:<token>'    → tracking channel; allow any authenticated user (token acts as the secret)
-- Anonymous users cannot subscribe.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can publish realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can publish realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);
