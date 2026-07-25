import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTokensFromCode } from '@/lib/google/oauth'
import { encrypt } from '@/lib/utils/encryption'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(`${origin}/accounts?error=no_code`)
    }

    const tokens = await getTokensFromCode(code)

    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${origin}/accounts?error=no_refresh_token`)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${origin}/login?error=not_authenticated`)

    const googleOAuth = new (await import('googleapis')).google.auth.OAuth2()
    googleOAuth.setCredentials({ access_token: tokens.access_token })

    const oauth2 = (await import('googleapis')).google.oauth2('v2')
    const { data: userInfo } = await oauth2.userinfo.get({ auth: googleOAuth })

    const encryptedRefresh = encrypt(tokens.refresh_token)
    const encryptedAccess = encrypt(tokens.access_token!)

    const { error } = await supabase.from('google_accounts').insert({
      user_id: user.id,
      google_email: userInfo.email || '',
      google_name: userInfo.name || userInfo.email?.split('@')[0] || 'Google Drive',
      refresh_token: encryptedRefresh,
      access_token: encryptedAccess,
      expires_at: new Date(Date.now() + (tokens.expiry_date || 3600000)).toISOString(),
      total_storage: 15 * 1e9,
      used_storage: 0,
      available_storage: 15 * 1e9,
    })

    if (error) {
      return NextResponse.redirect(`${origin}/accounts?error=save_failed`)
    }

    return NextResponse.redirect(`${origin}/accounts?connected=true`)
  } catch {
    return NextResponse.redirect(`${origin}/accounts?error=callback_failed`)
  }
}
