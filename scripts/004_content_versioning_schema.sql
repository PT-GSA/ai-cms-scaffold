-- Content Versioning Schema
-- Update existing schema untuk mendukung versioning yang lebih robust

-- Tambahkan kolom comment ke content_entry_versions
ALTER TABLE content_entry_versions 
ADD COLUMN IF NOT EXISTS comment TEXT,
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS change_summary JSONB;

-- Update existing schema untuk content versioning
DROP TRIGGER IF EXISTS create_content_entry_version_trigger ON content_entries;
DROP FUNCTION IF EXISTS create_content_entry_version();

-- Function untuk create content entry version yang lebih robust
CREATE OR REPLACE FUNCTION create_content_entry_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
  field_values_json JSONB := '{}';
  field_record RECORD;
  change_summary JSONB := '{}';
BEGIN
  -- Skip versioning jika ini adalah insert (akan dibuat manual)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version
  FROM content_entry_versions 
  WHERE content_entry_id = NEW.id;
  
  -- Use data column directly for field values (menggunakan struktur JSONB)
  field_values_json := COALESCE(NEW.data, '{}');
  
  -- Generate change summary
  change_summary := jsonb_build_object(
    'fields_changed', (
      SELECT count(*)::integer 
      FROM jsonb_each(COALESCE(OLD.data, '{}')) old_data
      FULL OUTER JOIN jsonb_each(COALESCE(NEW.data, '{}')) new_data
      ON old_data.key = new_data.key
      WHERE old_data.value IS DISTINCT FROM new_data.value
    ),
    'status_changed', (OLD.status IS DISTINCT FROM NEW.status),
    'slug_changed', (OLD.slug IS DISTINCT FROM NEW.slug)
  );
  
  -- Create version record
  INSERT INTO content_entry_versions (
    content_entry_id,
    version_number,
    title,
    slug,
    status,
    field_values,
    created_by,
    comment,
    is_auto_generated,
    change_summary
  ) VALUES (
    NEW.id,
    next_version,
    COALESCE(NEW.data->>'title', NEW.slug),
    NEW.slug,
    NEW.status,
    field_values_json,
    NEW.updated_by,
    'Auto-generated on update',
    true,
    change_summary
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger for auto-versioning
CREATE TRIGGER create_content_entry_version_trigger
  AFTER UPDATE ON content_entries
  FOR EACH ROW EXECUTE FUNCTION create_content_entry_version();

-- Function untuk initial version creation pada insert
CREATE OR REPLACE FUNCTION create_initial_content_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial version (version 1) untuk content entry baru
  INSERT INTO content_entry_versions (
    content_entry_id,
    version_number,
    title,
    slug,
    status,
    field_values,
    created_by,
    comment,
    is_auto_generated,
    change_summary
  ) VALUES (
    NEW.id,
    1,
    COALESCE(NEW.data->>'title', NEW.slug),
    NEW.slug,
    NEW.status,
    COALESCE(NEW.data, '{}'),
    NEW.created_by,
    'Initial version',
    true,
    jsonb_build_object('initial_version', true)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk create initial version
DROP TRIGGER IF EXISTS create_initial_content_version_trigger ON content_entries;
CREATE TRIGGER create_initial_content_version_trigger
  AFTER INSERT ON content_entries
  FOR EACH ROW EXECUTE FUNCTION create_initial_content_version();

-- Index untuk performance versioning queries
CREATE INDEX IF NOT EXISTS idx_content_entry_versions_entry_version 
  ON content_entry_versions(content_entry_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_content_entry_versions_created_at 
  ON content_entry_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_entry_versions_auto_generated 
  ON content_entry_versions(is_auto_generated);

-- View untuk version statistics
CREATE OR REPLACE VIEW content_version_stats AS
SELECT 
  ce.id as content_entry_id,
  ce.slug,
  COALESCE(ce.data->>'title', ce.slug) as title,
  ct.name as content_type_name,
  ct.display_name as content_type_display_name,
  COUNT(cev.id) as total_versions,
  MAX(cev.version_number) as latest_version,
  MIN(cev.created_at) as first_version_at,
  MAX(cev.created_at) as latest_version_at,
  COUNT(CASE WHEN cev.is_auto_generated = false THEN 1 END) as manual_versions,
  COUNT(CASE WHEN cev.is_auto_generated = true THEN 1 END) as auto_versions
FROM content_entries ce
LEFT JOIN content_entry_versions cev ON ce.id = cev.content_entry_id
LEFT JOIN content_types ct ON ce.content_type_id = ct.id
GROUP BY ce.id, ce.slug, ce.data, ct.name, ct.display_name;

-- Function untuk cleanup old versions (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_versions(
  retention_days INTEGER DEFAULT 90,
  keep_manual_versions BOOLEAN DEFAULT true
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete old auto-generated versions beyond retention period
  -- Keep manual versions and recent versions (last 10 per entry)
  
  WITH versions_to_delete AS (
    SELECT cev.id
    FROM content_entry_versions cev
    INNER JOIN (
      SELECT 
        content_entry_id,
        ROW_NUMBER() OVER (
          PARTITION BY content_entry_id 
          ORDER BY version_number DESC
        ) as row_num
      FROM content_entry_versions
    ) ranked ON cev.content_entry_id = ranked.content_entry_id 
              AND cev.version_number = ranked.row_num
    WHERE 
      cev.created_at < NOW() - (retention_days || ' days')::INTERVAL
      AND (NOT keep_manual_versions OR cev.is_auto_generated = true)
      AND ranked.row_num > 10  -- Keep last 10 versions per entry
      AND cev.version_number > 1  -- Never delete version 1
  )
  DELETE FROM content_entry_versions 
  WHERE id IN (SELECT id FROM versions_to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies untuk content_entry_versions
ALTER TABLE content_entry_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view content entry versions" ON content_entry_versions;
DROP POLICY IF EXISTS "Users can create content entry versions" ON content_entry_versions;
DROP POLICY IF EXISTS "Users can manage their content entry versions" ON content_entry_versions;

-- Policy untuk viewing versions
CREATE POLICY "Users can view content entry versions" ON content_entry_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_entries ce 
      WHERE ce.id = content_entry_versions.content_entry_id 
      AND (ce.status = 'published' OR ce.created_by = auth.uid())
    )
  );

-- Policy untuk creating versions (system only - through triggers)
CREATE POLICY "System can create content entry versions" ON content_entry_versions
  FOR INSERT WITH CHECK (true);

-- Policy untuk manual version operations
CREATE POLICY "Users can manage their content entry versions" ON content_entry_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM content_entries ce 
      WHERE ce.id = content_entry_versions.content_entry_id 
      AND ce.created_by = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON content_entry_versions TO service_role;
GRANT SELECT ON content_version_stats TO anon, authenticated;

-- Cleanup function for scheduled maintenance
-- This can be called periodically to manage storage
SELECT cleanup_old_versions(90, true);