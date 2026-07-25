import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTags, suggestFolder, detectDuplicates } from '@/lib/ai/groq'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { file_id } = await request.json()
    if (!file_id) return NextResponse.json({ error: 'file_id required' }, { status: 400 })

    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*, tags:ai_tags(*)')
      .eq('id', file_id)
      .eq('user_id', user.id)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const results: Record<string, unknown> = {}

    try {
      const tags = await generateTags(file.filename, file.mime_type)
      if (tags.length > 0) {
        const tagInserts = tags.map(tag => ({
          file_id: file.id,
          tag,
        }))
        await supabase.from('ai_tags').insert(tagInserts)
      }
      results.tags = tags
    } catch (e) {
      results.tags_error = (e as Error).message
    }

    try {
      const { data: folders } = await supabase
        .from('virtual_folders')
        .select('name')
        .eq('user_id', user.id)

      const folderNames = (folders || []).map(f => f.name)
      const path = await suggestFolder(file.filename, file.mime_type, folderNames)

      if (path.length > 0) {
        let parentId: string | null = null
        for (const folderName of path) {
          const { data: existingFolder }: any = await supabase
            .from('virtual_folders')
            .select('id')
            .eq('name', folderName)
            .eq('user_id', user.id)
            .eq('parent_id', parentId)
            .maybeSingle()

          if (existingFolder) {
            parentId = existingFolder.id
          } else {
            const { data: newFolder }: any = await supabase
              .from('virtual_folders')
              .insert({ name: folderName, user_id: user.id, parent_id: parentId })
              .select()
              .single()
            parentId = newFolder?.id || null
          }
        }

        if (parentId) {
          await supabase
            .from('files')
            .update({ virtual_folder_id: parentId })
            .eq('id', file.id)
        }
      }
      results.folder_path = path
    } catch (e) {
      results.folder_error = (e as Error).message
    }

    try {
      const { data: existingFiles } = await supabase
        .from('files')
        .select('filename, size')
        .eq('user_id', user.id)
        .neq('id', file.id)
        .limit(50)

      if (existingFiles && existingFiles.length > 0) {
        const duplicateResult = await detectDuplicates(
          file.filename,
          existingFiles.map(f => ({ filename: f.filename, size: Number(f.size) }))
        )
        results.duplicate_check = duplicateResult

        if (duplicateResult.is_duplicate && duplicateResult.confidence > 0.5) {
          await supabase.from('ai_tags').insert({
            file_id: file.id,
            tag: 'duplicate',
          })
        }
      }
    } catch (e) {
      results.duplicate_error = (e as Error).message
    }

    await supabase
      .from('files')
      .update({ ai_summary: `Tags: ${((results.tags as string[]) || []).join(', ')}` })
      .eq('id', file.id)

    return NextResponse.json({ file_id, results })
  } catch {
    return NextResponse.json({ error: 'AI pipeline failed' }, { status: 500 })
  }
}
