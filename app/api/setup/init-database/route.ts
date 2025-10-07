import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'

// Menggunakan service role untuk bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/setup/init-database
 * Menginisialisasi database dengan schema dan sample data
 */
async function postHandler() {
  try {
    console.log('🚀 Memulai inisialisasi database...')

    // 1. Buat tabel content_types jika belum ada
    const createContentTypesTable = `
      -- Tabel untuk menyimpan content types
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

      -- Tabel untuk menyimpan content entries
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
    `

    // Jalankan schema
    const { error: schemaError } = await supabase.rpc('execute_sql', {
      sql_query: createContentTypesTable
    })

    if (schemaError) {
      console.error('Error creating schema:', schemaError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create database schema',
          details: schemaError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Schema database berhasil dibuat')

    // 2. Insert sample content types
    const sampleContentTypes = [
      {
        name: 'article',
        display_name: 'Article',
        description: 'Blog articles and news posts',
        icon: 'FileText',
        is_active: true
      },
      {
        name: 'page',
        display_name: 'Page',
        description: 'Static pages like About, Contact',
        icon: 'File',
        is_active: true
      },
      {
        name: 'product',
        display_name: 'Product',
        description: 'E-commerce products',
        icon: 'Package',
        is_active: true
      }
    ]

    // Insert content types
    const { data: insertedContentTypes, error: insertError } = await supabase
      .from('content_types')
      .upsert(sampleContentTypes, { 
        onConflict: 'name',
        ignoreDuplicates: false 
      })
      .select()

    if (insertError) {
      console.error('Error inserting content types:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to insert sample content types',
          details: insertError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Sample content types berhasil dibuat')

    // 3. Insert sample fields untuk article content type
    const articleContentType = insertedContentTypes?.find(ct => ct.name === 'article')
    if (articleContentType) {
      const articleFields = [
        {
          content_type_id: articleContentType.id,
          field_name: 'title',
          display_name: 'Title',
          field_type: 'text',
          is_required: true,
          sort_order: 1
        },
        {
          content_type_id: articleContentType.id,
          field_name: 'content',
          display_name: 'Content',
          field_type: 'rich_text',
          is_required: true,
          sort_order: 2
        },
        {
          content_type_id: articleContentType.id,
          field_name: 'excerpt',
          display_name: 'Excerpt',
          field_type: 'textarea',
          is_required: false,
          sort_order: 3
        },
        {
          content_type_id: articleContentType.id,
          field_name: 'published_date',
          display_name: 'Published Date',
          field_type: 'datetime',
          is_required: false,
          sort_order: 4
        }
      ]

      const { error: fieldsError } = await supabase
        .from('content_type_fields')
        .upsert(articleFields, { 
          onConflict: 'content_type_id,field_name',
          ignoreDuplicates: false 
        })

      if (fieldsError) {
        console.warn('Warning: Could not insert article fields:', fieldsError)
      } else {
        console.log('✅ Article fields berhasil dibuat')
      }
    }

    // 4. Insert sample fields untuk page content type
    const pageContentType = insertedContentTypes?.find(ct => ct.name === 'page')
    if (pageContentType) {
      const pageFields = [
        {
          content_type_id: pageContentType.id,
          field_name: 'title',
          display_name: 'Title',
          field_type: 'text',
          is_required: true,
          sort_order: 1
        },
        {
          content_type_id: pageContentType.id,
          field_name: 'content',
          display_name: 'Content',
          field_type: 'rich_text',
          is_required: true,
          sort_order: 2
        },
        {
          content_type_id: pageContentType.id,
          field_name: 'meta_description',
          display_name: 'Meta Description',
          field_type: 'textarea',
          is_required: false,
          sort_order: 3
        }
      ]

      const { error: pageFieldsError } = await supabase
        .from('content_type_fields')
        .upsert(pageFields, { 
          onConflict: 'content_type_id,field_name',
          ignoreDuplicates: false 
        })

      if (pageFieldsError) {
        console.warn('Warning: Could not insert page fields:', pageFieldsError)
      } else {
        console.log('✅ Page fields berhasil dibuat')
      }
    }

    // 5. Insert sample fields untuk product content type
    const productContentType = insertedContentTypes?.find(ct => ct.name === 'product')
    if (productContentType) {
      const productFields = [
        {
          content_type_id: productContentType.id,
          field_name: 'name',
          display_name: 'Product Name',
          field_type: 'text',
          is_required: true,
          sort_order: 1
        },
        {
          content_type_id: productContentType.id,
          field_name: 'description',
          display_name: 'Description',
          field_type: 'rich_text',
          is_required: true,
          sort_order: 2
        },
        {
          content_type_id: productContentType.id,
          field_name: 'price',
          display_name: 'Price',
          field_type: 'number',
          is_required: true,
          sort_order: 3
        },
        {
          content_type_id: productContentType.id,
          field_name: 'sku',
          display_name: 'SKU',
          field_type: 'text',
          is_required: false,
          sort_order: 4
        }
      ]

      const { error: productFieldsError } = await supabase
        .from('content_type_fields')
        .upsert(productFields, { 
          onConflict: 'content_type_id,field_name',
          ignoreDuplicates: false 
        })

      if (productFieldsError) {
        console.warn('Warning: Could not insert product fields:', productFieldsError)
      } else {
        console.log('✅ Product fields berhasil dibuat')
      }
    }

    // 6. Verifikasi hasil
    const { data: allContentTypes, error: verifyError } = await supabase
      .from('content_types')
      .select(`
        id,
        name,
        display_name,
        description,
        icon,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('name')

    if (verifyError) {
      console.warn('Warning: Could not verify content types:', verifyError)
    }

    console.log('🎉 Database initialization completed!')

    return NextResponse.json({
      success: true,
      message: 'Database berhasil diinisialisasi dengan sample data',
      data: {
        content_types: allContentTypes || [],
        total_content_types: allContentTypes?.length || 0
      }
    })

  } catch (error) {
    console.error('Unexpected error during database initialization:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during database initialization',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Export dengan CORS support
export const POST = withCors(postHandler)
