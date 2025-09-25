import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

/**
 * Apply content entries schema to database
 * Membuat tabel dan struktur untuk content entries management
 */
export async function POST() {
  try {
    const supabase = createServiceClient()

    // SQL untuk membuat schema content entries
    const contentEntriesSQL = `
      -- Create content_entries table
      CREATE TABLE IF NOT EXISTS content_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_type_id UUID NOT NULL REFERENCES content_types(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(content_type_id, slug)
      );

      -- Create content_entry_values table
      CREATE TABLE IF NOT EXISTS content_entry_values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_entry_id UUID NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
        content_type_field_id UUID NOT NULL REFERENCES content_type_fields(id) ON DELETE CASCADE,
        text_value TEXT,
        number_value DECIMAL,
        boolean_value BOOLEAN,
        date_value DATE,
        datetime_value TIMESTAMPTZ,
        json_value JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(content_entry_id, content_type_field_id)
      );

      -- Create content_entry_versions table
      CREATE TABLE IF NOT EXISTS content_entry_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_entry_id UUID NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        field_values JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'draft',
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(content_entry_id, version_number)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_content_entries_content_type ON content_entries(content_type_id);
      CREATE INDEX IF NOT EXISTS idx_content_entries_slug ON content_entries(slug);
      CREATE INDEX IF NOT EXISTS idx_content_entries_status ON content_entries(status);
      CREATE INDEX IF NOT EXISTS idx_content_entries_published_at ON content_entries(published_at);
      CREATE INDEX IF NOT EXISTS idx_content_entry_values_entry ON content_entry_values(content_entry_id);
      CREATE INDEX IF NOT EXISTS idx_content_entry_values_field ON content_entry_values(content_type_field_id);
      CREATE INDEX IF NOT EXISTS idx_content_entry_versions_entry ON content_entry_versions(content_entry_id);

      -- Create function for slug generation
      CREATE OR REPLACE FUNCTION generate_unique_slug(
        p_content_type_id UUID,
        p_title TEXT,
        p_entry_id UUID DEFAULT NULL
      ) RETURNS TEXT AS $$
      DECLARE
        base_slug TEXT;
        final_slug TEXT;
        counter INTEGER := 0;
      BEGIN
        -- Generate base slug from title
        base_slug := lower(trim(regexp_replace(p_title, '[^a-zA-Z0-9\s]', '', 'g')));
        base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
        base_slug := trim(base_slug, '-');
        
        -- Ensure slug is not empty
        IF base_slug = '' THEN
          base_slug := 'untitled';
        END IF;
        
        final_slug := base_slug;
        
        -- Check for uniqueness and increment if needed
        WHILE EXISTS (
          SELECT 1 FROM content_entries 
          WHERE content_type_id = p_content_type_id 
          AND slug = final_slug 
          AND (p_entry_id IS NULL OR id != p_entry_id)
        ) LOOP
          counter := counter + 1;
          final_slug := base_slug || '-' || counter;
        END LOOP;
        
        RETURN final_slug;
      END;
      $$ LANGUAGE plpgsql;

      -- Create function for content entry versioning
      CREATE OR REPLACE FUNCTION create_content_entry_version()
      RETURNS TRIGGER AS $$
      DECLARE
        next_version INTEGER;
        field_values_json JSONB := '{}';
        field_record RECORD;
      BEGIN
        -- Get next version number
        SELECT COALESCE(MAX(version_number), 0) + 1 
        INTO next_version
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
          JOIN content_type_fields ctf ON cev.content_type_field_id = ctf.id
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
        
        -- Create version record
        INSERT INTO content_entry_versions (
          content_entry_id,
          version_number,
          title,
          field_values,
          status,
          created_by
        ) VALUES (
          NEW.id,
          next_version,
          NEW.title,
          field_values_json,
          NEW.status,
          NEW.updated_by
        );
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create updated_at trigger function if not exists
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers
      DROP TRIGGER IF EXISTS trigger_content_entries_updated_at ON content_entries;
      CREATE TRIGGER trigger_content_entries_updated_at
        BEFORE UPDATE ON content_entries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS trigger_content_entry_values_updated_at ON content_entry_values;
      CREATE TRIGGER trigger_content_entry_values_updated_at
        BEFORE UPDATE ON content_entry_values
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS trigger_content_entry_versioning ON content_entries;
      CREATE TRIGGER trigger_content_entry_versioning
        AFTER UPDATE ON content_entries
        FOR EACH ROW EXECUTE FUNCTION create_content_entry_version();
    `

    // Execute SQL menggunakan rpc
    const { error } = await supabase.rpc('execute_sql', { sql_query: contentEntriesSQL })

    if (error) {
      console.error('Error applying content entries schema:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to apply content entries schema',
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content entries schema applied successfully'
    })

  } catch (error) {
    console.error('Error in apply-content-entries:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}