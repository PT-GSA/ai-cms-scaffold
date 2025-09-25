/**
 * Script untuk membuat sample data content type
 * Menjalankan script ini akan membuat content type "article" dengan fields
 */

async function createSampleData() {
  try {
    console.log('🚀 Membuat sample data content type...')

    // Data content type yang akan dibuat
    const contentTypeData = {
      name: 'article',
      display_name: 'Article',
      description: 'Blog article content type',
      icon: 'FileText',
      fields: [
        {
          field_name: 'title',
          display_name: 'Title',
          field_type: 'text',
          is_required: true,
          sort_order: 1
        },
        {
          field_name: 'content',
          display_name: 'Content',
          field_type: 'textarea',
          is_required: true,
          sort_order: 2
        },
        {
          field_name: 'excerpt',
          display_name: 'Excerpt',
          field_type: 'textarea',
          is_required: false,
          sort_order: 3
        },
        {
          field_name: 'published_date',
          display_name: 'Published Date',
          field_type: 'datetime',
          is_required: false,
          sort_order: 4
        }
      ]
    }

    // Buat content type melalui API
    const response = await fetch('http://localhost:3000/api/content-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentTypeData)
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Content type "article" berhasil dibuat!')
      console.log('📝 Data:', result.data)
    } else {
      if (result.error === 'Content type with this name already exists') {
        console.log('✅ Content type "article" sudah ada')
      } else {
        console.error('❌ Error:', result.error)
      }
    }

    console.log('🎉 Sample data selesai diproses!')

  } catch (error) {
    console.error('❌ Error membuat sample data:', error.message)
    process.exit(1)
  }
}

// Jalankan script
createSampleData()