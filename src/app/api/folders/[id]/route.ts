import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'keep'

    const { data: folder } = await supabase
      .from('virtual_folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

    if (mode === 'delete') {
      await supabase
        .from('files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('virtual_folder_id', id)
        .eq('user_id', user.id)
    }

    const { error } = await supabase
      .from('virtual_folders')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, mode })
  } catch {
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}
