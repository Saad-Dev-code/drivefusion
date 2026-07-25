import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: folders, error } = await supabase
      .from('virtual_folders')
      .select('*')
      .eq('user_id', user.id)
      .is('parent_id', null)
      .order('name')

    if (error) throw error

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
