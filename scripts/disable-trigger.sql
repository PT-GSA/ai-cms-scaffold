-- Temporarily disable the problematic trigger
-- Run this in Supabase SQL Editor

-- Drop the trigger that's causing issues
DROP TRIGGER IF EXISTS create_content_entry_version_trigger ON content_entries;

-- Optionally, create a fixed version of the function
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

-- Recreate the trigger with the fixed function (optional)
-- CREATE TRIGGER create_content_entry_version_trigger
--   AFTER UPDATE ON content_entries
--   FOR EACH ROW
--   EXECUTE FUNCTION create_content_entry_version();
