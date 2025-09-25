-- Content Entries Schema
-- Tabel untuk menyimpan content entries berdasarkan content types

-- Tabel untuk content entries
CREATE TABLE IF NOT EXISTS content_entries (
  id BIGSERIAL PRIMARY KEY,
  content_type_id BIGINT NOT NULL REFERENCES content_types(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint untuk slug per content type
  UNIQUE(content_type_id, slug)
);

-- Tabel untuk field values dari content entries
CREATE TABLE IF NOT EXISTS content_entry_values (
  id BIGSERIAL PRIMARY KEY,
  content_entry_id BIGINT NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  content_type_field_id BIGINT NOT NULL REFERENCES content_type_fields(id) ON DELETE CASCADE,
  
  -- Berbagai tipe data untuk field values
  text_value TEXT,
  number_value NUMERIC,
  boolean_value BOOLEAN,
  date_value DATE,
  datetime_value TIMESTAMPTZ,
  json_value JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint untuk field per entry
  UNIQUE(content_entry_id, content_type_field_id)
);

-- Tabel untuk content versioning
CREATE TABLE IF NOT EXISTS content_entry_versions (
  id BIGSERIAL PRIMARY KEY,
  content_entry_id BIGINT NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  field_values JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint untuk version per entry
  UNIQUE(content_entry_id, version_number)
);

-- Enable pg_trgm extension untuk text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_content_entries_content_type_id ON content_entries(content_type_id);
CREATE INDEX IF NOT EXISTS idx_content_entries_status ON content_entries(status);
CREATE INDEX IF NOT EXISTS idx_content_entries_slug ON content_entries(slug);
CREATE INDEX IF NOT EXISTS idx_content_entries_published_at ON content_entries(published_at);
CREATE INDEX IF NOT EXISTS idx_content_entries_created_by ON content_entries(created_by);

CREATE INDEX IF NOT EXISTS idx_content_entry_values_entry_id ON content_entry_values(content_entry_id);
CREATE INDEX IF NOT EXISTS idx_content_entry_values_field_id ON content_entry_values(content_type_field_id);
CREATE INDEX IF NOT EXISTS idx_content_entry_values_text ON content_entry_values USING gin(text_value gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_content_entry_versions_entry_id ON content_entry_versions(content_entry_id);
CREATE INDEX IF NOT EXISTS idx_content_entry_versions_version ON content_entry_versions(version_number);

-- RLS Policies
ALTER TABLE content_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_entry_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_entry_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view published content entries" ON content_entries;
DROP POLICY IF EXISTS "Users can create content entries" ON content_entries;
DROP POLICY IF EXISTS "Users can create their own content entries" ON content_entries;
DROP POLICY IF EXISTS "Users can update their content entries" ON content_entries;
DROP POLICY IF EXISTS "Users can update their own content entries" ON content_entries;
DROP POLICY IF EXISTS "Users can delete their own content entries" ON content_entries;

-- Policy untuk content_entries
CREATE POLICY "Users can view published content entries" ON content_entries
  FOR SELECT USING (status = 'published' OR auth.uid() = created_by);

CREATE POLICY "Users can create their own content entries" ON content_entries
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own content entries" ON content_entries
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Users can delete their own content entries" ON content_entries
  FOR DELETE USING (auth.uid() = created_by);

-- Policy untuk content_entry_values
DROP POLICY IF EXISTS "Users can view content entry values" ON content_entry_values;
DROP POLICY IF EXISTS "Users can manage content entry values" ON content_entry_values;

CREATE POLICY "Users can view content entry values" ON content_entry_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_entries ce 
      WHERE ce.id = content_entry_values.content_entry_id 
      AND (ce.status = 'published' OR ce.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage content entry values" ON content_entry_values
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM content_entries ce 
      WHERE ce.id = content_entry_values.content_entry_id 
      AND ce.created_by = auth.uid()
    )
  );

-- Policy untuk content_entry_versions
DROP POLICY IF EXISTS "Users can view content entry versions" ON content_entry_versions;
DROP POLICY IF EXISTS "Users can manage content entry versions" ON content_entry_versions;

CREATE POLICY "Users can view content entry versions" ON content_entry_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_entries ce 
      WHERE ce.id = content_entry_versions.content_entry_id 
      AND ce.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage content entry versions" ON content_entry_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM content_entries ce 
      WHERE ce.id = content_entry_versions.content_entry_id 
      AND ce.created_by = auth.uid()
    )
  );

-- Triggers untuk updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_content_entries_updated_at ON content_entries;
CREATE TRIGGER update_content_entries_updated_at 
  BEFORE UPDATE ON content_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_entry_values_updated_at ON content_entry_values;
CREATE TRIGGER update_content_entry_values_updated_at 
  BEFORE UPDATE ON content_entry_values 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function untuk auto-generate slug
CREATE OR REPLACE FUNCTION generate_slug(title TEXT, content_type_id BIGINT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug dari title
  base_slug := lower(regexp_replace(trim(title), '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Jika slug kosong, gunakan default
  IF base_slug = '' THEN
    base_slug := 'untitled';
  END IF;
  
  final_slug := base_slug;
  
  -- Check uniqueness dan tambahkan counter jika perlu
  WHILE EXISTS (
    SELECT 1 FROM content_entries 
    WHERE slug = final_slug 
    AND content_type_id = generate_slug.content_type_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function untuk create content entry version
CREATE OR REPLACE FUNCTION create_content_entry_version()
RETURNS TRIGGER AS $$
DECLARE
  version_num INTEGER;
  field_values_json JSONB := '{}';
  field_record RECORD;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO version_num
  FROM content_entry_versions 
  WHERE content_entry_id = NEW.id;
  
  -- Collect field values into JSON
  FOR field_record IN 
    SELECT 
      ctf.field_name,
      cev.text_value,
      cev.number_value,
      cev.boolean_value,
      cev.date_value,
      cev.datetime_value,
      cev.json_value
    FROM content_entry_values cev
    JOIN content_type_fields ctf ON ctf.id = cev.content_type_field_id
    WHERE cev.content_entry_id = NEW.id
  LOOP
    field_values_json := field_values_json || jsonb_build_object(
      field_record.field_name,
      COALESCE(
        field_record.text_value,
        field_record.number_value::text,
        field_record.boolean_value::text,
        field_record.date_value::text,
        field_record.datetime_value::text,
        field_record.json_value
      )
    );
  END LOOP;
  
  -- Insert version
  INSERT INTO content_entry_versions (
    content_entry_id,
    version_number,
    title,
    slug,
    status,
    field_values,
    created_by
  ) VALUES (
    NEW.id,
    version_num,
    NEW.title,
    NEW.slug,
    NEW.status,
    field_values_json,
    NEW.updated_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-versioning
DROP TRIGGER IF EXISTS create_content_entry_version_trigger ON content_entries;
CREATE TRIGGER create_content_entry_version_trigger
  AFTER UPDATE ON content_entries
  FOR EACH ROW
  EXECUTE FUNCTION create_content_entry_version();