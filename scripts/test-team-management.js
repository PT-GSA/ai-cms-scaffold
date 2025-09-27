import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testTeamManagement() {
  try {
    console.log('🧪 Testing Team Management System...')
    console.log('=' * 50)

    // 1. Test user_profiles table
    console.log('\n1️⃣ Testing user_profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3)

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError.message)
    } else {
      console.log('✅ User profiles found:', profiles?.length || 0)
      profiles?.forEach(profile => {
        console.log(`   - ${profile.display_name} (${profile.role})`)
      })
    }

    // 2. Test user_invitations table
    console.log('\n2️⃣ Testing user_invitations table...')
    const { data: invitations, error: invitationsError } = await supabase
      .from('user_invitations')
      .select('*')
      .limit(3)

    if (invitationsError) {
      console.error('❌ Error fetching invitations:', invitationsError.message)
    } else {
      console.log('✅ Invitations found:', invitations?.length || 0)
      invitations?.forEach(invitation => {
        console.log(`   - ${invitation.email} (${invitation.role}) - ${invitation.status}`)
      })
    }

    // 3. Test teams table
    console.log('\n3️⃣ Testing teams table...')
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')

    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError.message)
    } else {
      console.log('✅ Teams found:', teams?.length || 0)
      teams?.forEach(team => {
        console.log(`   - ${team.name} (${team.slug})`)
      })
    }

    // 4. Test audit_logs table
    console.log('\n4️⃣ Testing audit_logs table...')
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(3)

    if (logsError) {
      console.error('❌ Error fetching audit logs:', logsError.message)
    } else {
      console.log('✅ Audit logs found:', logs?.length || 0)
      logs?.forEach(log => {
        console.log(`   - ${log.action} (${log.resource_type})`)
      })
    }

    console.log('\n✅ Team Management System test completed!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testTeamManagement()
