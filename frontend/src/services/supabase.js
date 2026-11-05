import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mbrhbhlzgfwpvmznnoih.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_F-335BRATcg-E3onYCSjgA_tOcp4KF0'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Publishable Key is missing from frontend environment.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export default supabase

