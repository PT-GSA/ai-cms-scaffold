/**
 * Script untuk test API playground dengan bun
 */

import { createClient } from '@supabase/supabase-js'

// Konfigurasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://headless.csmigroup.id'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Test API playground dengan content type yang sudah ada
 */
async function testApiPlayground() {
  try {
    console.log('🧪 Testing API Playground...')
    console.log('=' * 50)

    // 1. Cek content types yang ada
    console.log('\n1️⃣ Mengambil content types yang ada...')
    const { data: contentTypes, error: typesError } = await supabase
      .from('content_types')
      .select('id, name, display_name, is_active')
      .eq('is_active', true)
      .limit(5)

    if (typesError) {
      console.error('❌ Error mengambil content types:', typesError.message)
      return
    }

    console.log('✅ Content types yang tersedia:')
    contentTypes?.forEach(type => {
      console.log(`   - ${type.name} (${type.display_name})`)
    })

    // 2. Cek API keys yang ada
    console.log('\n2️⃣ Mengambil API keys yang ada...')
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('id, key_name, key_value, is_active, user_id')
      .eq('is_active', true)
      .limit(3)

    if (keysError) {
      console.error('❌ Error mengambil API keys:', keysError.message)
      return
    }

    if (!apiKeys || apiKeys.length === 0) {
      console.log('⚠️ Tidak ada API keys yang aktif. Silakan buat API key terlebih dahulu.')
      return
    }

    console.log('✅ API keys yang tersedia:')
    apiKeys.forEach(key => {
      console.log(`   - ${key.key_name}: ${key.key_value.substring(0, 8)}...`)
    })

    // 3. Test dengan API key pertama
    const testApiKey = apiKeys[0].key_value
    const testContentType = contentTypes?.[0]?.name || 'blog_post'

    console.log(`\n3️⃣ Testing dengan API key: ${testApiKey.substring(0, 8)}...`)
    console.log(`   Content type untuk test: ${testContentType}`)

    const baseUrl = 'http://localhost:3000'

    // Test GET content types
    console.log('\n📝 Testing GET /api/public/content-types')
    try {
      const response = await fetch(`${baseUrl}/api/public/content-types`, {
        headers: {
          'x-api-key': testApiKey
        }
      })
      
      const data = await response.json()
      console.log(`   Status: ${response.status}`)
      console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`)
    } catch (error) {
      console.error('   ❌ Error:', error.message)
    }

    // Test PUT content type
    console.log(`\n📝 Testing PUT /api/public/content-types/${testContentType}`)
    try {
      const updateData = {
        display_name: 'Updated Blog Post',
        description: 'Updated blog post content type',
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true
          },
          {
            name: 'content',
            type: 'textarea',
            required: true
          },
          {
            name: 'author',
            type: 'text',
            required: false
          }
        ],
        is_active: true
      }

      const response = await fetch(`${baseUrl}/api/public/content-types/${testContentType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey
        },
        body: JSON.stringify(updateData)
      })
      
      const data = await response.json()
      console.log(`   Status: ${response.status}`)
      console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`)
      
      if (response.status !== 200) {
        console.log(`   Full response:`, JSON.stringify(data, null, 2))
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message)
    }

    console.log('\n✅ Test selesai!')
    console.log('\n📋 Instruksi untuk menggunakan API Playground:')
    console.log('1. Buka http://localhost:3000/dashboard/docs')
    console.log('2. Masukkan API key yang valid')
    console.log('3. Pilih endpoint PUT /api/public/content-types/[slug]')
    console.log('4. Klik "Load Example" untuk mengisi form')
    console.log('5. Klik "Send Request" untuk test')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Jalankan test
testApiPlayground()
