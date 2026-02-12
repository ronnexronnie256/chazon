-- Supabase Storage Policies for 'chazon' bucket
-- Run these in your Supabase SQL Editor

-- 1. Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chazon');

-- 2. Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chazon')
WITH CHECK (bucket_id = 'chazon');

-- 3. Allow public read access (for public URLs)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chazon');

-- 4. Allow authenticated users to delete their own files
-- Optional: You can restrict this to only allow users to delete their own files
-- by checking the owner: USING (auth.uid()::text = (storage.foldername(name))[1])
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chazon');

-- Alternative: More restrictive policy that only allows users to manage their own files
-- Uncomment and use this if you want users to only manage files in their own folder

-- CREATE POLICY "Users can manage own files"
-- ON storage.objects FOR ALL
-- TO authenticated
-- USING (
--   bucket_id = 'chazon' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- )
-- WITH CHECK (
--   bucket_id = 'chazon' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

