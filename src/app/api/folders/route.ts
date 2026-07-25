import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')
    const all = searchParams.get('all') === 'true'

    let query = supabase
      .from('virtual_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (all) {
      // Return ALL folders as flat list (for folder picker)
    } else if (parentId === 'null') {
      query = query.is('parent_id', null)
    } else if (parentId) {
      query = query.eq('parent_id', parentId)
    } else {
      query = query.is('parent_id', null)
    }

    const { data: folders, error } = await query
    if (error) throw error

    if (!all && !parentId) {
      const foldersWithChildren = await Promise.all(
        (folders || []).map(async (folder) => {
          const { data: children } = await supabase
            .from('virtual_folders')
            .select('*')
            .eq('parent_id', folder.id)
            .order('name')
          return { ...folder, children: children || [] }
        })
      )
      return NextResponse.json({ folders: foldersWithChildren })
    }

    return NextResponse.json({ folders: folders || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, parent_id } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('virtual_folders')
      .insert({ name, user_id: user.id, parent_id: parent_id || null })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ folder: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
