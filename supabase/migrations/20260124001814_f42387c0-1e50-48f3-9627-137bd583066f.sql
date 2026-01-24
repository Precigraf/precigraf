-- Fix storage bucket policy: restrict SELECT to user's own files only
-- Drop the overly permissive policy that allows any authenticated user to read all files
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;

-- Create policy that restricts viewing to user's own files
-- Files are stored in folders named after the user's UUID
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'armazenamento' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);