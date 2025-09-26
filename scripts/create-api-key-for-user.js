/**
 * Script untuk membuat API key untuk user tertentu
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

async function createApiKeyForUser() {
  try {
    const userId = '5e8545a0-0dff-4673-ae61-20377fd2c09c'
    
    console.log(`📝 Membuat API key untuk user: ${userId}`)

    // Sample API keys untuk user ini
    const sampleKeys = [
      {
        user_id: userId,
        key_name: 'Production API Key',
        key_type: 'production',
        key_value: 'sk-prod-' + Math.random().toString(36).substring(2, 18),
        key_prefix: 'sk-prod',
        is_active: true
      },
      {
        user_id: userId,
        key_name: 'Development API Key',
        key_type: 'development',
        key_value: 'sk-dev-' + Math.random().toString(36).substring(2, 18),
        key_prefix: 'sk-dev',
        is_active: false
      },
      {
        user_id: userId,
        key_name: 'Test API Key',
        key_type: 'test',
        key_value: 'sk-test-' + Math.random().toString(36).substring(2, 18),
        key_prefix: 'sk-test',
        is_active: true
      }
    ]

    console.log('📝 Menyisipkan API keys...')

    for (const key of sampleKeys) {
      const { data, error } = await supabase
        .from('api_keys')
        .insert(key)
        .select()

      if (error) {
        console.error(`❌ Error creating ${key.key_name}:`, error.message)
      } else {
        console.log(`✅ Created: ${key.key_name} (${key.key_type})`)
        console.log(`   ID: ${data[0].id}`)
        console.log(`   Value: ${key.key_value}`)
      }
    }

    console.log('\n🎉 API keys berhasil dibuat!')
    console.log('🌐 Silakan:')
    console.log('   1. Refresh halaman http://localhost:3000/dashboard/settings')
    console.log('   2. Pilih tab "API Keys"')
    console.log('   3. Tombol eye dan copy sekarang akan muncul!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Jalankan script
createApiKeyForUser()
