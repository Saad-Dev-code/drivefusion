import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: accounts, error } = await supabase
      .from('google_accounts')
      .select('id, total_storage, used_storage, available_storage, google_email, google_name')
      .eq('user_id', user.id)

    if (error) throw error

    const total_storage = accounts.reduce((s, a) => s + Number(a.total_storage), 0)
    const used_storage = accounts.reduce((s, a) => s + Number(a.used_storage), 0)
    const available_storage = accounts.reduce((s, a) => s + Number(a.available_storage), 0)

    const { data: largestFiles } = await supabase
      .from('files')
      .select('id, filename, size, mime_type')
      .eq('user_id', user.id)
      .order('size', { ascending: false })
      .limit(20)

    return NextResponse.json({
      total_storage,
      used_storage,
      available_storage,
      accounts,
      largest_files: largestFiles || [],
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch storage info' }, { status: 500 })
  }
}
