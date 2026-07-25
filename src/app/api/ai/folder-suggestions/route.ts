import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestFolderGroups } from '@/lib/ai/groq'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: files, error } = await supabase
      .from('files')
      .select('id, filename, mime_type')
      .eq('user_id', user.id)
      .is('virtual_folder_id', null)
      .limit(100)

    if (error) throw error
    if (!files || files.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = await suggestFolderGroups(
      files.map(f => ({ filename: f.filename, mimeType: f.mime_type, id: f.id }))
    )

    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
