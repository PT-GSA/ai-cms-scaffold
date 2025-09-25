import { createBrowserClient } from "@supabase/ssr"

/**
 * Membuat Supabase client untuk browser/client-side
 * Digunakan di Client Components dan browser environment
 */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

/**
 * Membuat Supabase service client dengan service role key
 * Hanya untuk operasi admin/service
 */
export function createServiceClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
