import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: file, error } = await supabase
      .from('files')
      .select('*, tags:ai_tags(*), google_account:google_accounts(google_email, google_name)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json(file)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { filename, virtual_folder_id } = body

    const updates: Record<string, string | null> = {}
    if (filename) updates.filename = filename
    if (virtual_folder_id !== undefined) updates.virtual_folder_id = virtual_folder_id

    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: file } = await supabase
      .from('files')
      .select('drive_file_id, google_account_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
