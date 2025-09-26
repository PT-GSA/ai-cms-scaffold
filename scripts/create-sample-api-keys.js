/**
 * Script untuk membuat sample API keys untuk testing
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

async function createSampleApiKeys() {
  try {
    console.log('📝 Membuat sample API keys untuk testing...')
    console.log('💡 Catatan: API keys ini akan terlihat setelah Anda login dan buka halaman settings')

    // Sample API keys dengan user_id dummy (akan diganti saat user login)
    const sampleKeys = [
      {
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        key_name: 'Production API Key',
        key_type: 'production',
        key_value: 'sk-prod-' + Math.random().toString(36).substring(2, 18),
        key_prefix: 'sk-prod',
        is_active: true
      },
      {
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        key_name: 'Development API Key',
        key_type: 'development',
        key_value: 'sk-dev-' + Math.random().toString(36).substring(2, 18),
        key_prefix: 'sk-dev',
        is_active: false
      },
      {
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        key_name: 'Test API Key',
        key_type: 'test',
        key_value: 'sk-test-' + Math.random().toString(36).substring(2, 18),
        key_prefix: 'sk-test',
        is_active: true
      }
    ]

    console.log('📝 Menyisipkan sample API keys...')

    for (const key of sampleKeys) {
      const { data, error } = await supabase
        .from('api_keys')
        .insert(key)
        .select()

      if (error) {
        console.error(`❌ Error creating ${key.key_name}:`, error.message)
      } else {
        console.log(`✅ Created: ${key.key_name} (${key.key_type})`)
      }
    }

    console.log('🎉 Sample API keys berhasil dibuat!')
    console.log('🌐 Silakan:')
    console.log('   1. Login ke aplikasi')
    console.log('   2. Buka http://localhost:3000/dashboard/settings')
    console.log('   3. Pilih tab "API Keys"')
    console.log('   4. Klik "Generate New Key" untuk membuat API key baru')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Jalankan script
createSampleApiKeys()
