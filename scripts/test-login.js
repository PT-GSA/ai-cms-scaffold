/**
 * Script untuk test login dengan akun user
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Konfigurasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://headless.csmigroup.id'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan di environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  try {
    const email = 'pt.gemerlangsejahteraabadi@gmail.com'
    const password = '@V03061992v'
    
    console.log(`🔐 Testing login dengan email: ${email}`)

    // Test login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.error('❌ Login failed:', error.message)
      return
    }

    if (data.user) {
      console.log('✅ Login berhasil!')
      console.log('   User ID:', data.user.id)
      console.log('   Email:', data.user.email)
      console.log('   Created:', data.user.created_at)
      
      // Test akses API keys
      console.log('\n🔍 Testing akses API keys...')
      
      const { data: apiKeys, error: apiKeysError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })

      if (apiKeysError) {
        console.error('❌ Error fetching API keys:', apiKeysError.message)
      } else {
        console.log(`✅ Found ${apiKeys.length} API keys:`)
        apiKeys.forEach((key, index) => {
          console.log(`   ${index + 1}. ${key.key_name} (${key.key_type}) - ${key.is_active ? 'Active' : 'Inactive'}`)
        })
      }
      
      // Test logout
      console.log('\n🚪 Testing logout...')
      const { error: logoutError } = await supabase.auth.signOut()
      
      if (logoutError) {
        console.error('❌ Logout failed:', logoutError.message)
      } else {
        console.log('✅ Logout berhasil!')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Jalankan test
testLogin()
