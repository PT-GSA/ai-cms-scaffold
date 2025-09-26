/**
 * Script untuk memeriksa API key tertentu
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

async function checkSpecificApiKey() {
  try {
    const userId = '5e8545a0-0dff-4673-ae61-20377fd2c09c'
    
    console.log(`🔍 Memeriksa API keys untuk user: ${userId}`)

    // Cek API keys berdasarkan user_id
    const { data: userApiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    if (!userApiKeys || userApiKeys.length === 0) {
      console.log('❌ Tidak ada API keys untuk user ini')
      console.log('💡 User perlu membuat API key melalui UI terlebih dahulu')
      return
    }

    console.log(`✅ Ditemukan ${userApiKeys.length} API keys untuk user:`)
    userApiKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ID: ${key.id}`)
      console.log(`      Name: ${key.key_name}`)
      console.log(`      Type: ${key.key_type}`)
      console.log(`      Value: ${key.key_value}`)
      console.log(`      Active: ${key.is_active}`)
      console.log(`      Created: ${key.created_at}`)
      console.log('')
    })

    // Cek semua API keys
    console.log('\n🔍 Memeriksa semua API keys...')
    const { data: allKeys, error: allError } = await supabase
      .from('api_keys')
      .select('id, key_name, key_type, is_active, user_id, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Error getting all keys:', allError.message)
      return
    }

    console.log(`📊 Total API keys: ${allKeys.length}`)
    allKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key.key_name} (${key.key_type}) - ${key.is_active ? 'Active' : 'Inactive'} - User: ${key.user_id}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Jalankan script
checkSpecificApiKey()
