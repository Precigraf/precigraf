-- Remove the public read policy for the storage bucket
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- Add authenticated-only read policy
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'armazenamento');