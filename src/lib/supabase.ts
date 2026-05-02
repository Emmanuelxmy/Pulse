import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Gracefully handle missing/invalid config so the app loads offline-first
function createSafeClient() {
  try {
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      throw new Error('Supabase not configured')
    }
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch {
    // Return a stub so imports don't crash — sync will fail silently
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
}

export const supabase = createSafeClient()
