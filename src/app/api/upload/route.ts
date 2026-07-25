import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/google/drive'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const virtualFolderId = formData.get('virtual_folder_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const { data: accounts } = await supabase
      .from('google_accounts')
      .select('id, available_storage')
      .eq('user_id', user.id)
      .order('available_storage', { ascending: false })
      .limit(1)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No connected Google Drive accounts' }, { status: 400 })
    }

    const bestAccount = accounts[0]

    const buffer = Buffer.from(await file.arrayBuffer())
    const driveFile = await uploadFile(bestAccount.id, buffer, {
      name: file.name,
      mimeType: file.type,
    })

    const { data: fileRecord, error } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        google_account_id: bestAccount.id,
        drive_file_id: driveFile.id!,
        filename: file.name,
        mime_type: file.type,
        size: file.size,
        virtual_folder_id: virtualFolderId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(fileRecord)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
