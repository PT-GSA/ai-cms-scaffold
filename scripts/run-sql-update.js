/**
 * Script untuk menjalankan update SQL function
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Konfigurasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://headless.csmigroup.id'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSqlUpdate() {
  try {
    console.log('📝 Reading SQL update file...')
    
    const sqlFile = path.join(__dirname, 'update-generate-api-key-function.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    console.log('🔧 Executing SQL update...')
    
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sqlContent
    })

    if (error) {
      console.error('❌ Error executing SQL:', error)
      return
    }

    console.log('✅ SQL update executed successfully!')
    console.log('📊 Result:', data)

    // Test the updated function
    console.log('🧪 Testing updated function...')
    
    const testUserId = '5e8545a0-0dff-4673-ae61-20377fd2c09c'
    
    const { data: testResult, error: testError } = await supabase
      .rpc('generate_api_key', {
        p_user_id: testUserId,
        p_key_name: 'Test Updated Function',
        p_key_type: 'development'
      })

    if (testError) {
      console.error('❌ Error testing function:', testError)
    } else {
      console.log('✅ Function test successful!')
      console.log('📊 Test result:', JSON.stringify(testResult, null, 2))
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Jalankan update
runSqlUpdate()