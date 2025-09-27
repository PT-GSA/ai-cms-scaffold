/**
 * Script untuk menjalankan team management schema
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Konfigurasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase environment variables tidak ditemukan')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runTeamManagementSchema() {
  try {
    console.log('🚀 Running Team Management Schema...')
    console.log('=' * 50)

    // Baca SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', '008_team_management_schema.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📝 Executing SQL schema...')
    
    // Jalankan SQL menggunakan Supabase RPC
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sqlContent
    })

    if (error) {
      console.error('❌ Error executing schema:', error)
      return false
    }

    console.log('✅ Team Management Schema executed successfully!')
    console.log('📋 Created tables:')
    console.log('   - user_profiles')
    console.log('   - user_invitations')
    console.log('   - teams')
    console.log('   - team_members')
    console.log('   - audit_logs')
    
    console.log('🔐 RLS Policies created for all tables')
    console.log('⚡ Triggers and functions created')
    
    // Test schema dengan query sederhana
    console.log('\n🧪 Testing schema...')
    
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Schema test failed:', testError)
      return false
    }

    console.log('✅ Schema test passed!')
    
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Jalankan schema
runTeamManagementSchema()
  .then(success => {
    if (success) {
      console.log('\n🎉 Team Management setup completed successfully!')
      console.log('\n📋 Next steps:')
      console.log('1. Update your team management page to use the new API')
      console.log('2. Test invitation flow')
      console.log('3. Configure email service (Supabase Edge Functions)')
      console.log('4. Test RBAC permissions')
    } else {
      console.log('\n❌ Team Management setup failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
