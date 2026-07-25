import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findSimilarDuplicates } from '@/lib/ai/groq'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: allFiles } = await supabase
      .from('files')
      .select('id, filename, size, virtual_folder_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (!allFiles || allFiles.length === 0) {
      return NextResponse.json({ groups: [], total: 0, new_tags: 0 })
    }

    const groups: {
      filename: string
      size: number
      occurrences: number
      folders: (string | null)[]
      files: { id: string; folder_name: string | null }[]
      type: 'exact' | 'ai'
    }[] = []

    let newTagsCount = 0

    const { data: existingTags } = await supabase
      .from('ai_tags')
      .select('file_id, tag')
      .in('file_id', allFiles.map(f => f.id))

    const taggedFileIds = new Set(
      (existingTags || []).filter(t => t.tag === 'duplicate').map(t => t.file_id)
    )

    const { data: folderMap } = await supabase
      .from('virtual_folders')
      .select('id, name')
      .eq('user_id', user.id)

    const folderNames = new Map((folderMap || []).map(f => [f.id, f.name]))

    const seen = new Map<string, typeof allFiles>()
    for (const file of allFiles) {
      const key = `${file.filename}||${file.size}`
      if (!seen.has(key)) seen.set(key, [])
      seen.get(key)!.push(file)
    }

    for (const [, files] of seen) {
      if (files.length <= 1) continue

      files.sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime())
      const keep = files[0]
      const duplicates = files.slice(1)

      const group = {
        filename: keep.filename,
        size: Number(keep.size),
        occurrences: files.length,
        folders: [...new Set(files.map(f => folderNames.get(f.virtual_folder_id || '') || null))],
        files: files.map(f => ({
          id: f.id,
          folder_name: folderNames.get(f.virtual_folder_id || '') || null,
        })),
        type: 'exact' as const,
      }
      groups.push(group)

      for (const dup of duplicates) {
        if (!taggedFileIds.has(dup.id)) {
          await supabase.from('ai_tags').insert({ file_id: dup.id, tag: 'duplicate' })
          newTagsCount++
        }
      }
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (groqApiKey) {
      try {
        const untaggedFiles = allFiles.filter(f => !taggedFileIds.has(f.id))
        if (untaggedFiles.length > 1) {
          const aiResult = await findSimilarDuplicates(
            untaggedFiles.map(f => ({ id: f.id, filename: f.filename, size: Number(f.size) }))
          )

          if (aiResult.groups) {
            for (const aiGroup of aiResult.groups) {
              if (aiGroup.file_ids.length < 2) continue

              const matchFiles = aiGroup.file_ids
                .map(id => allFiles.find(f => f.id === id))
                .filter(Boolean) as typeof allFiles

              if (matchFiles.length < 2) continue

              const representative = matchFiles[0]
              const aiGroupData = {
                filename: representative.filename,
                size: Number(representative.size),
                occurrences: matchFiles.length,
                folders: [...new Set(matchFiles.map(f => folderNames.get(f.virtual_folder_id || '') || null))],
                files: matchFiles.map(f => ({
                  id: f.id,
                  folder_name: folderNames.get(f.virtual_folder_id || '') || null,
                })),
                type: 'ai' as const,
              }
              groups.push(aiGroupData)

              for (const dup of matchFiles.slice(1)) {
                if (!taggedFileIds.has(dup.id)) {
                  await supabase.from('ai_tags').insert({ file_id: dup.id, tag: 'duplicate' })
                  newTagsCount++
                }
              }
            }
          }
        }
      } catch {
        // AI scan is optional — fall back to exact-only results
      }
    }

    return NextResponse.json({ groups, total: groups.length, new_tags: newTagsCount })
  } catch {
    return NextResponse.json({ error: 'Duplicate scan failed' }, { status: 500 })
  }
}
