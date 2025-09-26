/**
 * Script untuk test function generate_api_key
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

async function testGenerateApiKeyFunction() {
  try {
    console.log('🧪 Testing generate_api_key function...')

    // Test dengan user ID dummy
    const testUserId = '5e8545a0-0dff-4673-ae61-20377fd2c09c'
    
    console.log(`📝 Calling generate_api_key function for user: ${testUserId}`)

    const { data: result, error } = await supabase
      .rpc('generate_api_key', {
        p_user_id: testUserId,
        p_key_name: 'Test API Key from Script',
        p_key_type: 'development'
      })

    if (error) {
      console.error('❌ Error calling generate_api_key function:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return
    }

    if (!result || result.length === 0) {
      console.error('❌ Function returned empty result')
      return
    }

    console.log('✅ Function executed successfully!')
    console.log('📊 Result:', JSON.stringify(result, null, 2))

    // Verify the key was actually inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', result[0].id)

    if (verifyError) {
      console.error('❌ Error verifying inserted key:', verifyError)
    } else {
      console.log('✅ Key verified in database:', verifyData[0])
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Jalankan test
testGenerateApiKeyFunction()