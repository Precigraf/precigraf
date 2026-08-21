CREATE POLICY "Catalog builder images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalog-builder');

CREATE POLICY "Users can upload their own catalog builder images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog-builder' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own catalog builder images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog-builder' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'catalog-builder' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own catalog builder images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'catalog-builder' AND auth.uid()::text = (storage.foldername(name))[1]);