import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folder')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('files')
      .select('*, tags:ai_tags(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (folderId) {
      query = query.eq('virtual_folder_id', folderId)
    }

    if (search) {
      query = query.ilike('filename', `%${search}%`)
    }

    if (type) {
      query = query.eq('mime_type', type)
    }

    const { data: files, error } = await query

    if (error) throw error

    const { count } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({ files, total: count })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
