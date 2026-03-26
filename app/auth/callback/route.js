import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /auth/callback
 * Handles the Supabase PKCE auth callback.
 * Supabase redirects here with ?code=xxx after email verification/password reset.
 * We exchange the code for a session and redirect to the target page.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'
  const type = searchParams.get('type') || ''

  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            flowType: 'pkce',
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          }
        }
      )

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback - code exchange error:', error.message)
        // Redirect to forgot-password with error
        return NextResponse.redirect(new URL('/forgot-password?error=expired', origin))
      }

      // For password recovery, redirect to reset-password with tokens in hash
      if (type === 'recovery' || next === '/reset-password') {
        const resetUrl = new URL('/reset-password', origin)
        // Pass the access token as a hash fragment so the client can use it
        resetUrl.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=recovery`
        return NextResponse.redirect(resetUrl)
      }

      // For other auth flows, redirect to the next page
      return NextResponse.redirect(new URL(next, origin))
    } catch (err) {
      console.error('Auth callback error:', err)
      return NextResponse.redirect(new URL('/forgot-password?error=unknown', origin))
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(new URL('/', origin))
}
