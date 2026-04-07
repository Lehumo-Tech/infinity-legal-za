import { createClient } from '@supabase/supabase-js'

/**
 * Extract and verify user from Supabase JWT token in request headers.
 * Returns user object or null if unauthorized.
 */
export async function getUserFromRequest(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    const token = authHeader.split(' ')[1]
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch (e) {
    console.error('Auth error:', e)
    return null
  }
}

/**
 * Get user profile from Supabase profiles table
 */
export async function getUserProfile(userId) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return data
  } catch (e) {
    console.error('Profile fetch error:', e)
    return null
  }
}
