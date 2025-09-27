-- Fix content entry version trigger untuk struktur data yang baru
-- Data sekarang disimpan di kolom 'data' sebagai JSONB, bukan kolom 'title'

-- Function untuk create content entry version (updated)
CREATE OR REPLACE FUNCTION create_content_entry_version()
RETURNS TRIGGER AS $$
DECLARE
  version_num INTEGER;
  field_values_json JSONB := '{}';
  title_value TEXT;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO version_num
  FROM content_entry_versions 
  WHERE content_entry_id = NEW.id;
  
  -- Extract title from data JSONB column, fallback to slug
  title_value := COALESCE(NEW.data->>'title', NEW.slug, 'Untitled');
  
  -- Use data column as field_values if it exists
  IF NEW.data IS NOT NULL THEN
    field_values_json := NEW.data;
  END IF;
  
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
    title_value,
    NEW.slug,
    NEW.status,
    field_values_json,
    NEW.updated_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
