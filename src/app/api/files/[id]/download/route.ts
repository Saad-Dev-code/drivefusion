import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { downloadFile } from '@/lib/google/drive'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: file } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const stream = await downloadFile(file.google_account_id, file.drive_file_id)

    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
