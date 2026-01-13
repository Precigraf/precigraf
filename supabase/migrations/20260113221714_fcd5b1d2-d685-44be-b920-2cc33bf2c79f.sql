-- Remove the create_webhook_user function as it's no longer needed
DROP FUNCTION IF EXISTS public.create_webhook_user(uuid, text, text);