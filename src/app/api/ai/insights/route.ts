import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeStorage, explainStorage } from '@/lib/ai/groq'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: accounts } = await supabase
      .from('google_accounts')
      .select('*')
      .eq('user_id', user.id)

    const { data: files } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)

    if (!accounts || !files) {
      return NextResponse.json({ insights: [], explanation: null })
    }

    const totalSize = files.reduce((s, f) => s + Number(f.size), 0)
    const byType: Record<string, { count: number; size: number }> = {}

    for (const f of files) {
      let type = 'Other'
      if (f.mime_type.startsWith('image/')) type = 'Image'
      else if (f.mime_type.startsWith('video/')) type = 'Video'
      else if (f.mime_type.startsWith('audio/')) type = 'Audio'
      else if (f.mime_type.includes('pdf')) type = 'PDF'
      else if (f.mime_type.includes('zip')) type = 'Archive'

      if (!byType[type]) byType[type] = { count: 0, size: 0 }
      byType[type].count += 1
      byType[type].size += Number(f.size)
    }

    const stats = {
      totalSize,
      fileCount: files.length,
      byType,
      accounts: accounts.map(a => ({
        email: a.google_email,
        used: Number(a.used_storage),
        total: Number(a.total_storage),
      })),
    }

    const groqInsights = await analyzeStorage(stats)
    const explanation = await explainStorage(
      totalSize,
      totalSize * 0.92,
      accounts.map(a => ({ email: a.google_email, used: Number(a.used_storage) }))
    )

    return NextResponse.json({
      insights: groqInsights.insights || [],
      explanation,
    })
  } catch {
    return NextResponse.json({ error: 'AI insights failed' }, { status: 500 })
  }
}
