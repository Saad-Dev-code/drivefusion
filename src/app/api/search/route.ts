import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type')
    const tag = searchParams.get('tag')
    const folderId = searchParams.get('folder')

    let dbQuery = supabase
      .from('files')
      .select('*, tags:ai_tags(*), google_account:google_accounts(google_email, google_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (query) {
      dbQuery = dbQuery.or(`filename.ilike.%${query}%,ai_summary.ilike.%${query}%`)
    }

    if (type) {
      dbQuery = dbQuery.eq('mime_type', type)
    }

    if (folderId) {
      dbQuery = dbQuery.eq('virtual_folder_id', folderId)
    }

    if (tag) {
      const { data: fileIds } = await supabase
        .from('ai_tags')
        .select('file_id')
        .eq('tag', tag)
      if (fileIds && fileIds.length > 0) {
        dbQuery = dbQuery.in('id', fileIds.map(f => f.file_id))
      }
    }

    const { data: files, error } = await dbQuery

    if (error) throw error

    return NextResponse.json({ files, query })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
