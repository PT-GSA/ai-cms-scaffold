import { createClient } from '@supabase/supabase-js'

/**
 * Membuat Supabase admin client dengan service role key
 * Digunakan untuk operasi server-side yang memerlukan akses admin
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}