/**
 * Script untuk test API key tertentu
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Konfigurasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://headless.csmigroup.id'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Test API key dengan berbagai endpoint
 */
async function testApiKey(apiKey) {
  try {
    console.log(`🧪 Testing API key: ${apiKey}`)
    console.log('=' * 50)

    // 1. Cek apakah API key ada di database
    console.log('\n1️⃣ Memeriksa API key di database...')
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_value', apiKey)
      .single()

    if (keyError) {
      console.error('❌ API key tidak ditemukan di database:', keyError.message)
      return false
    }

    console.log('✅ API key ditemukan di database:')
    console.log(`   ID: ${keyData.id}`)
    console.log(`   Name: ${keyData.key_name}`)
    console.log(`   Type: ${keyData.key_type}`)
    console.log(`   Active: ${keyData.is_active}`)
    console.log(`   User ID: ${keyData.user_id}`)
    console.log(`   Created: ${keyData.created_at}`)

    if (!keyData.is_active) {
      console.log('⚠️ API key tidak aktif!')
      return false
    }

    // 2. Test endpoint public API
    console.log('\n2️⃣ Testing endpoint public API...')
    
    const baseUrl = 'http://localhost:3000'
    
    // Test public content types
    console.log('📝 Testing GET /api/public/content-types')
    try {
      const response = await fetch(`${baseUrl}/api/public/content-types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Public content types berhasil diakses')
        console.log(`   Found ${data.length || 0} content types`)
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`)
    }

    // Test public content entries (memerlukan parameter content_type)
    console.log('📝 Testing GET /api/public/content-entries?content_type=blog')
    try {
      const response = await fetch(`${baseUrl}/api/public/content-entries?content_type=blog`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Public content entries berhasil diakses')
        console.log(`   Found ${data.length || 0} content entries`)
      } else {
        const errorText = await response.text()
        console.log(`❌ Error: ${response.status} - ${response.statusText}`)
        console.log(`   Response: ${errorText}`)
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`)
    }

    // Test public media
    console.log('📝 Testing GET /api/public/media')
    try {
      const response = await fetch(`${baseUrl}/api/public/media`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Public media berhasil diakses')
        console.log(`   Found ${data.length || 0} media files`)
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`)
    }

    // 3. Update last_used_at
    console.log('\n3️⃣ Updating last_used_at...')
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id)

    if (updateError) {
      console.log('❌ Error updating last_used_at:', updateError.message)
    } else {
      console.log('✅ last_used_at berhasil diupdate')
    }

    console.log('\n🎉 API key test selesai!')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

// Ambil API key dari command line argument atau gunakan default
const apiKeyToTest = process.argv[2] || 'sk-prod-bc002b70ce4ad8292c2399f6fa98095c'

console.log('🚀 Starting API Key Test...')
testApiKey(apiKeyToTest)