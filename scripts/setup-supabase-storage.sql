-- Setup Supabase Storage bucket untuk media files
-- Script ini harus dijalankan di Supabase Dashboard SQL Editor

-- 1. Buat bucket 'media-files' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-files', 'media-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies untuk bucket 'media-files'

-- Policy untuk SELECT (read) - semua authenticated user bisa read
CREATE POLICY "Authenticated users can view media files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'media-files' AND 
  auth.role() = 'authenticated'
);

-- Policy untuk INSERT (upload) - hanya authenticated user bisa upload
CREATE POLICY "Authenticated users can upload media files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media-files' AND 
  auth.role() = 'authenticated'
);

-- Policy untuk UPDATE - hanya owner yang bisa update
CREATE POLICY "Users can update their own media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media-files' AND 
  auth.uid() = owner
) WITH CHECK (
  bucket_id = 'media-files' AND 
  auth.uid() = owner
);

-- Policy untuk DELETE - hanya owner yang bisa delete
CREATE POLICY "Users can delete their own media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media-files' AND 
  auth.uid() = owner
);

-- 3. Enable RLS pada storage.objects jika belum enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Grant permissions yang diperlukan
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;