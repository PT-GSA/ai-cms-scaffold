-- Update media_files table untuk menambah kolom storage_path
-- Script ini menambahkan kolom storage_path untuk menyimpan path file di Supabase Storage

ALTER TABLE media_files 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Update existing records untuk backward compatibility
-- Untuk file yang sudah ada, kita bisa set storage_path berdasarkan file_path
UPDATE media_files 
SET storage_path = CASE 
  WHEN file_path LIKE '/uploads/%' THEN SUBSTRING(file_path FROM 10) -- Remove '/uploads/' prefix
  ELSE file_path 
END
WHERE storage_path IS NULL;

-- Add comment untuk dokumentasi
COMMENT ON COLUMN media_files.storage_path IS 'Path file di Supabase Storage bucket (tanpa bucket name)';
COMMENT ON COLUMN media_files.file_path IS 'Public URL atau path untuk akses file';