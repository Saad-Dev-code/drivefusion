import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const groqApiKey = process.env.GROQ_API_KEY

    if (!groqApiKey) {
      return NextResponse.json({ error: 'AI search not configured' }, { status: 503 })
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You convert natural language search queries into structured database filters for a file storage system. Return ONLY valid JSON with fields: filename_contains (string), mime_type (string), min_size (number in bytes), max_size (number), date_range (object with start/end ISO strings or null), tags (array of strings), folder (string). Set fields to null if not specified. No other text.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqResponse.ok) {
      return NextResponse.json({ error: 'AI search failed' }, { status: 502 })
    }

    const groqData = await groqResponse.json()
    const filters = JSON.parse(groqData.choices[0].message.content)

    let dbQuery = supabase
      .from('files')
      .select('*, tags:ai_tags(*), google_account:google_accounts(google_email, google_name)')
      .eq('user_id', user.id)

    if (filters.filename_contains) {
      dbQuery = dbQuery.ilike('filename', `%${filters.filename_contains}%`)
    }
    if (filters.mime_type) {
      dbQuery = dbQuery.ilike('mime_type', `${filters.mime_type}%`)
    }
    if (filters.min_size) {
      dbQuery = dbQuery.gte('size', filters.min_size)
    }
    if (filters.max_size) {
      dbQuery = dbQuery.lte('size', filters.max_size)
    }
    if (filters.date_range?.start) {
      dbQuery = dbQuery.gte('created_at', filters.date_range.start)
    }
    if (filters.date_range?.end) {
      dbQuery = dbQuery.lte('created_at', filters.date_range.end)
    }
    if (filters.tags && filters.tags.length > 0) {
      const { data: tagFileIds } = await supabase
        .from('ai_tags')
        .select('file_id')
        .in('tag', filters.tags)
      if (tagFileIds && tagFileIds.length > 0) {
        dbQuery = dbQuery.in('id', [...new Set(tagFileIds.map(f => f.file_id))])
      }
    }
    if (filters.folder) {
      const { data: folders } = await supabase
        .from('virtual_folders')
        .select('id')
        .ilike('name', `%${filters.folder}%`)
        .eq('user_id', user.id)
      if (folders && folders.length > 0) {
        dbQuery = dbQuery.in('virtual_folder_id', folders.map(f => f.id))
      }
    }

    dbQuery = dbQuery.order('created_at', { ascending: false }).limit(50)

    const { data: files, error } = await dbQuery

    if (error) throw error

    return NextResponse.json({ files, query, ai_transformed: filters })
  } catch {
    return NextResponse.json({ error: 'AI search failed' }, { status: 500 })
  }
}
