-- Media Management Schema
-- Tabel untuk menyimpan metadata file media

-- Tabel media_files untuk menyimpan informasi file yang diupload
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document', 'other'
    width INTEGER, -- untuk image/video
    height INTEGER, -- untuk image/video
    duration INTEGER, -- untuk video/audio (dalam detik)
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_mime_type ON media_files(mime_type);

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_files_updated_at
    BEFORE UPDATE ON media_files
    FOR EACH ROW
    EXECUTE FUNCTION update_media_files_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all media files
CREATE POLICY "Users can view all media files" ON media_files
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can insert their own media files
CREATE POLICY "Users can insert their own media files" ON media_files
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Policy: Users can update their own media files
CREATE POLICY "Users can update their own media files" ON media_files
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Policy: Users can delete their own media files
CREATE POLICY "Users can delete their own media files" ON media_files
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Tabel media_folders untuk organisasi file (opsional)
CREATE TABLE IF NOT EXISTS media_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk media_folders
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_created_by ON media_folders(created_by);

-- Trigger untuk update timestamp media_folders
CREATE TRIGGER trigger_update_media_folders_updated_at
    BEFORE UPDATE ON media_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_media_files_updated_at();

-- RLS untuk media_folders
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage folders" ON media_folders
    FOR ALL USING (auth.role() = 'authenticated');

-- Tambahkan kolom folder_id ke media_files
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_folder_id ON media_files(folder_id);