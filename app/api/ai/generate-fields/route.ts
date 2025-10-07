import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'

export interface FieldGenerationRequest {
  contentTypeName: string
  contentTypeDescription: string
  businessDomain?: string
  targetAudience?: string
  additionalRequirements?: string
}

export interface GeneratedField {
  field_name: string
  display_name: string
  field_type: 'text' | 'textarea' | 'rich_text' | 'number' | 'boolean' | 'date' | 'datetime' | 'email' | 'url' | 'select' | 'multi_select' | 'media' | 'relation' | 'json'
  is_required: boolean
  is_unique: boolean
  default_value?: string
  help_text?: string
  validation_rules?: Record<string, unknown>
  field_options?: Record<string, unknown>
  sort_order: number
}

export interface FieldGenerationResponse {
  fields: GeneratedField[]
  suggestions: string[]
  reasoning: string
}

/**
 * POST /api/ai/generate-fields
 * Generate content type fields menggunakan AI atau fallback
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      contentTypeName,
      contentTypeDescription,
      businessDomain = 'general',
      targetAudience = 'general audience',
      additionalRequirements = ''
    }: FieldGenerationRequest = body

    if (!contentTypeName || !contentTypeDescription) {
      return NextResponse.json({
        success: false,
        error: 'Content type name and description are required'
      }, { status: 400 })
    }

    console.log('Generating fields for:', { contentTypeName, contentTypeDescription, businessDomain })

    // Generate fields based on content type and business domain
    const generatedData = generateSmartFields(contentTypeName, contentTypeDescription, businessDomain, targetAudience, additionalRequirements)

    return NextResponse.json({
      success: true,
      data: generatedData
    })

  } catch (error) {
    console.error('Error generating fields:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate fields'
    }, { status: 500 })
  }
}

/**
 * Generate smart fields berdasarkan content type dan business domain
 */
function generateSmartFields(
  contentTypeName: string, 
  contentTypeDescription: string, 
  businessDomain: string,
  targetAudience: string,
  additionalRequirements: string
): FieldGenerationResponse {
  
  // Base fields yang umum diperlukan
  const baseFields: GeneratedField[] = [
    {
      field_name: 'title',
      display_name: 'Title',
      field_type: 'text',
      is_required: true,
      is_unique: false,
      help_text: 'Judul utama content',
      validation_rules: { min_length: 5, max_length: 100 },
      sort_order: 1
    },
    {
      field_name: 'slug',
      display_name: 'Slug',
      field_type: 'text',
      is_required: true,
      is_unique: true,
      help_text: 'URL-friendly identifier',
      validation_rules: { pattern: '^[a-z0-9-]+$' },
      sort_order: 2
    }
  ]

  // Content fields berdasarkan tipe
  const contentFields: GeneratedField[] = []
  const contentTypeLower = contentTypeName.toLowerCase()
  
  if (contentTypeLower.includes('article') || contentTypeLower.includes('blog') || contentTypeLower.includes('post')) {
    contentFields.push(
      {
        field_name: 'content',
        display_name: 'Content',
        field_type: 'rich_text',
        is_required: true,
        is_unique: false,
        help_text: 'Konten utama artikel',
        sort_order: 3
      },
      {
        field_name: 'excerpt',
        display_name: 'Excerpt',
        field_type: 'textarea',
        is_required: false,
        is_unique: false,
        help_text: 'Ringkasan artikel',
        sort_order: 4
      },
      {
        field_name: 'featured_image',
        display_name: 'Featured Image',
        field_type: 'media',
        is_required: false,
        is_unique: false,
        help_text: 'Gambar utama artikel',
        sort_order: 5
      }
    )
  } else if (contentTypeLower.includes('product')) {
    contentFields.push(
      {
        field_name: 'description',
        display_name: 'Description',
        field_type: 'rich_text',
        is_required: true,
        is_unique: false,
        help_text: 'Deskripsi produk',
        sort_order: 3
      },
      {
        field_name: 'price',
        display_name: 'Price',
        field_type: 'number',
        is_required: true,
        is_unique: false,
        help_text: 'Harga produk',
        validation_rules: { min: 0 },
        sort_order: 4
      },
      {
        field_name: 'sku',
        display_name: 'SKU',
        field_type: 'text',
        is_required: false,
        is_unique: true,
        help_text: 'Stock Keeping Unit',
        sort_order: 5
      },
      {
        field_name: 'images',
        display_name: 'Product Images',
        field_type: 'media',
        is_required: false,
        is_unique: false,
        help_text: 'Gambar produk',
        sort_order: 6
      }
    )
  } else if (contentTypeLower.includes('page')) {
    contentFields.push(
      {
        field_name: 'content',
        display_name: 'Content',
        field_type: 'rich_text',
        is_required: true,
        is_unique: false,
        help_text: 'Konten halaman',
        sort_order: 3
      }
    )
  } else {
    // Default content field
    contentFields.push(
      {
        field_name: 'content',
        display_name: 'Content',
        field_type: 'rich_text',
        is_required: true,
        is_unique: false,
        help_text: 'Konten utama',
        sort_order: 3
      }
    )
  }

  // SEO fields
  const seoFields: GeneratedField[] = [
    {
      field_name: 'meta_title',
      display_name: 'Meta Title',
      field_type: 'text',
      is_required: false,
      is_unique: false,
      help_text: 'SEO meta title',
      validation_rules: { max_length: 60 },
      sort_order: contentFields.length + 4
    },
    {
      field_name: 'meta_description',
      display_name: 'Meta Description',
      field_type: 'textarea',
      is_required: false,
      is_unique: false,
      help_text: 'SEO meta description',
      validation_rules: { max_length: 160 },
      sort_order: contentFields.length + 5
    }
  ]

  // Publishing fields
  const publishingFields: GeneratedField[] = [
    {
      field_name: 'status',
      display_name: 'Status',
      field_type: 'select',
      is_required: true,
      is_unique: false,
      default_value: 'draft',
      field_options: {
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      sort_order: contentFields.length + 6
    },
    {
      field_name: 'published_at',
      display_name: 'Published Date',
      field_type: 'datetime',
      is_required: false,
      is_unique: false,
      help_text: 'Tanggal publikasi',
      sort_order: contentFields.length + 7
    }
  ]

  // Business domain specific fields
  const businessFields: GeneratedField[] = []
  
  if (businessDomain === 'ecommerce') {
    businessFields.push(
      {
        field_name: 'category',
        display_name: 'Category',
        field_type: 'select',
        is_required: false,
        is_unique: false,
        help_text: 'Kategori produk',
        field_options: {
          options: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'clothing', label: 'Clothing' },
            { value: 'books', label: 'Books' },
            { value: 'home', label: 'Home & Garden' }
          ]
        },
        sort_order: contentFields.length + 8
      },
      {
        field_name: 'tags',
        display_name: 'Tags',
        field_type: 'multi_select',
        is_required: false,
        is_unique: false,
        help_text: 'Tag untuk kategorisasi',
        sort_order: contentFields.length + 9
      }
    )
  } else if (businessDomain === 'blog') {
    businessFields.push(
      {
        field_name: 'category',
        display_name: 'Category',
        field_type: 'select',
        is_required: false,
        is_unique: false,
        help_text: 'Kategori artikel',
        field_options: {
          options: [
            { value: 'technology', label: 'Technology' },
            { value: 'business', label: 'Business' },
            { value: 'lifestyle', label: 'Lifestyle' },
            { value: 'news', label: 'News' }
          ]
        },
        sort_order: contentFields.length + 8
      },
      {
        field_name: 'author',
        display_name: 'Author',
        field_type: 'text',
        is_required: false,
        is_unique: false,
        help_text: 'Penulis artikel',
        sort_order: contentFields.length + 9
      }
    )
  }

  // Combine all fields
  const allFields = [...baseFields, ...contentFields, ...seoFields, ...publishingFields, ...businessFields]
  
  // Generate suggestions
  const suggestions = [
    `Content type "${contentTypeName}" telah dibuat dengan ${allFields.length} fields`,
    'Pertimbangkan menambahkan field untuk analytics tracking jika diperlukan',
    'Field untuk custom metadata bisa ditambahkan sesuai kebutuhan'
  ]

  if (businessDomain === 'ecommerce') {
    suggestions.push('Pertimbangkan menambahkan field untuk inventory management')
  }

  if (contentTypeLower.includes('product')) {
    suggestions.push('Field untuk reviews dan ratings bisa berguna untuk produk')
  }

  const reasoning = `Fields untuk "${contentTypeName}" dibuat berdasarkan:
- Tipe content: ${contentTypeDescription}
- Domain bisnis: ${businessDomain}
- Target audience: ${targetAudience}
- Termasuk field SEO, publishing, dan business-specific`

  return {
    fields: allFields,
    suggestions,
    reasoning
  }
}

// Export dengan CORS support
export const POST = withCors(postHandler)