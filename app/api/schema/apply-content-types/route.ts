import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { withCors } from '@/lib/cors'

/**
 * POST /api/schema/apply-content-types
 * Menjalankan SQL schema untuk content types melalui Supabase
 */
async function postHandler() {
  try {
    const supabase = createServiceClient()

    // SQL schema untuk content types
    const contentTypesSchema = `
      -- Content Types Schema untuk Headless CMS
      
      -- Tabel untuk menyimpan content types (seperti Article, Product, Page, dll)
      CREATE TABLE IF NOT EXISTS content_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enum untuk field types yang didukung
      DO $$ BEGIN
        CREATE TYPE field_type AS ENUM (
          'text',
          'textarea', 
          'rich_text',
          'number',
          'boolean',
          'date',
          'datetime',
          'email',
          'url',
          'select',
          'multi_select',
          'media',
          'relation',
          'json'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Tabel untuk menyimpan field definitions dalam content type
      CREATE TABLE IF NOT EXISTS content_type_fields (
        id SERIAL PRIMARY KEY,
        content_type_id INTEGER REFERENCES content_types(id) ON DELETE CASCADE,
        field_name VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        field_type field_type NOT NULL,
        is_required BOOLEAN DEFAULT false,
        is_unique BOOLEAN DEFAULT false,
        default_value TEXT,
        validation_rules JSONB,
        field_options JSONB,
        help_text TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(content_type_id, field_name)
      );

      -- Tabel untuk menyimpan content entries (data aktual)
      CREATE TABLE IF NOT EXISTS content_entries (
        id SERIAL PRIMARY KEY,
        content_type_id INTEGER REFERENCES content_types(id) ON DELETE CASCADE,
        slug VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        data JSONB NOT NULL,
        meta_data JSONB,
        published_at TIMESTAMP WITH TIME ZONE,
        created_by UUID REFERENCES auth.users(id),
        updated_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(content_type_id, slug)
      );

      -- Index untuk performa
      CREATE INDEX IF NOT EXISTS idx_content_types_name ON content_types(name);
      CREATE INDEX IF NOT EXISTS idx_content_type_fields_content_type ON content_type_fields(content_type_id);
      CREATE INDEX IF NOT EXISTS idx_content_entries_content_type ON content_entries(content_type_id);
      CREATE INDEX IF NOT EXISTS idx_content_entries_status ON content_entries(status);
      CREATE INDEX IF NOT EXISTS idx_content_entries_slug ON content_entries(slug);
      CREATE INDEX IF NOT EXISTS idx_content_entries_published_at ON content_entries(published_at);

      -- Enable Row Level Security
      ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
      ALTER TABLE content_type_fields ENABLE ROW LEVEL SECURITY;
      ALTER TABLE content_entries ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view content types" ON content_types;
      DROP POLICY IF EXISTS "Users can create content types" ON content_types;
      DROP POLICY IF EXISTS "Users can update their content types" ON content_types;
      DROP POLICY IF EXISTS "Users can view content type fields" ON content_type_fields;
      DROP POLICY IF EXISTS "Users can manage content type fields" ON content_type_fields;
      DROP POLICY IF EXISTS "Users can view published content entries" ON content_entries;
      DROP POLICY IF EXISTS "Users can create content entries" ON content_entries;
      DROP POLICY IF EXISTS "Users can update their content entries" ON content_entries;

      -- RLS Policies untuk content_types
      CREATE POLICY "Users can view content types" ON content_types
        FOR SELECT USING (auth.uid() IS NOT NULL);

      CREATE POLICY "Users can create content types" ON content_types
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

      CREATE POLICY "Users can update their content types" ON content_types
        FOR UPDATE USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

      -- RLS Policies untuk content_type_fields
      CREATE POLICY "Users can view content type fields" ON content_type_fields
        FOR SELECT USING (auth.uid() IS NOT NULL);

      CREATE POLICY "Users can manage content type fields" ON content_type_fields
        FOR ALL USING (
          auth.uid() IS NOT NULL AND 
          EXISTS (
            SELECT 1 FROM content_types 
            WHERE id = content_type_fields.content_type_id 
            AND created_by = auth.uid()
          )
        );

      -- RLS Policies untuk content_entries
      CREATE POLICY "Users can view published content entries" ON content_entries
        FOR SELECT USING (
          auth.uid() IS NOT NULL AND 
          (status = 'published' OR created_by = auth.uid())
        );

      CREATE POLICY "Users can create content entries" ON content_entries
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

      CREATE POLICY "Users can update their content entries" ON content_entries
        FOR UPDATE USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

      -- Function untuk auto-update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Drop existing triggers if they exist
      DROP TRIGGER IF EXISTS update_content_types_updated_at ON content_types;
      DROP TRIGGER IF EXISTS update_content_type_fields_updated_at ON content_type_fields;
      DROP TRIGGER IF EXISTS update_content_entries_updated_at ON content_entries;

      -- Triggers untuk auto-update timestamps
      CREATE TRIGGER update_content_types_updated_at 
        BEFORE UPDATE ON content_types 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_content_type_fields_updated_at 
        BEFORE UPDATE ON content_type_fields 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_content_entries_updated_at 
        BEFORE UPDATE ON content_entries 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    // Jalankan schema menggunakan function execute_sql
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: contentTypesSchema
    })

    if (error) {
      console.error('Error executing content types schema:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to execute content types schema',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Insert default content types jika berhasil
    const defaultContentTypes = [
      {
        name: 'article',
        display_name: 'Article',
        description: 'Blog articles and news posts',
        icon: 'FileText'
      },
      {
        name: 'page',
        display_name: 'Page',
        description: 'Static pages like About, Contact',
        icon: 'File'
      },
      {
        name: 'product',
        display_name: 'Product',
        description: 'E-commerce products',
        icon: 'Package'
      }
    ]

    // Insert default content types
    const { error: insertError } = await supabase
      .from('content_types')
      .upsert(defaultContentTypes, { 
        onConflict: 'name',
        ignoreDuplicates: true 
      })

    if (insertError) {
      console.warn('Warning: Could not insert default content types:', insertError)
    }

    return NextResponse.json({
      success: true,
      message: 'Content types schema applied successfully',
      data: data
    })

  } catch (error) {
    console.error('Unexpected error:', error)
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

// Export dengan CORS support
export const POST = withCors(postHandler);