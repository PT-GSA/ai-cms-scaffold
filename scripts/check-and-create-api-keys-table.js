/**
 * Script untuk memeriksa dan membuat tabel api_keys jika belum ada
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

async function checkAndCreateApiKeysTable() {
  try {
    console.log('🔍 Memeriksa tabel api_keys...')

    // Cek apakah tabel sudah ada dengan mencoba query langsung
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('id')
      .limit(1)

    if (apiKeysError) {
      if (apiKeysError.code === '42P01') {
        console.log('❌ Tabel api_keys belum ada')
        console.log('📝 Jalankan script SQL: scripts/007_api_keys_schema.sql')
        return
      } else {
        console.error('❌ Error checking api_keys:', apiKeysError)
        return
      }
    }

    console.log('✅ Tabel api_keys sudah ada')
    
    // Cek jumlah data
    const { count, error: countError } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting api_keys:', countError)
    } else {
      console.log(`📊 Jumlah API keys: ${count}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Jalankan script
checkAndCreateApiKeysTable()
