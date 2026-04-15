UPDATE storage.buckets SET public = true WHERE id = 'armazenamento';

CREATE POLICY "Public read access on armazenamento"
ON storage.objects FOR SELECT
USING (bucket_id = 'armazenamento');