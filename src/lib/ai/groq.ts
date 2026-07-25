const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function groqRequest(
  systemPrompt: string,
  userContent: string,
  model = 'llama-3.3-70b-versatile'
) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) throw new Error('Groq API request failed')

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

export async function generateTags(filename: string, mimeType: string): Promise<string[]> {
  const result = await groqRequest(
    'You are a file tagging system. Given a filename and mime type, generate 3-6 relevant semantic tags. Return JSON format: { "tags": ["tag1", "tag2", ...] }',
    `Filename: ${filename}\nType: ${mimeType}`
  )
  return result.tags || []
}

export async function suggestFolder(filename: string, mimeType: string, existingFolders: string[]): Promise<string[]> {
  const result = await groqRequest(
    'You suggest virtual folder paths for organizing files. Given a filename and mime type, suggest a folder hierarchy (2-3 levels). Return JSON: { "path": ["Folder1", "Subfolder1", "Subfolder2"] }',
    `Filename: ${filename}\nType: ${mimeType}\nExisting folders: ${existingFolders.join(', ')}`
  )
  return result.path || []
}

export async function detectDuplicates(
  newFilename: string,
  existingFiles: { filename: string; size: number }[]
): Promise<{ is_duplicate: boolean; reason: string; confidence: number }> {
  const result = await groqRequest(
    'You detect duplicate or similar files. Given a new filename and a list of existing files, determine if it is a likely duplicate, version, or similar file. Return JSON: { "is_duplicate": boolean, "reason": string, "confidence": number (0-1) }',
    `New file: ${newFilename}\nExisting files: ${JSON.stringify(existingFiles)}`
  )
  return result
}

export async function analyzeStorage(stats: {
  totalSize: number | string
  fileCount: number
  byType: Record<string, { count: number; size: number | string }>
  accounts: { email: string; used: number | string; total: number | string }[]
}): Promise<{ insights: { type: string; title: string; description: string }[] }> {
  const result = await groqRequest(
    'You analyze cloud storage data and provide actionable insights. Return JSON format: { "insights": [{ "type": "storage|duplicate|organization", "title": string, "description": string }] }',
    `Storage stats: ${JSON.stringify(stats)}`
  )
  return result
}

export async function explainStorage(
  current: number | string,
  previous: number | string,
  accounts: { email: string; used: number | string }[]
): Promise<{ explanation: string; recommendation: string }> {
  const result = await groqRequest(
    'You explain storage changes in simple, actionable language. Return JSON: { "explanation": string, "recommendation": string }',
    `Current usage: ${current}\nPrevious usage: ${previous}\nAccounts: ${JSON.stringify(accounts)}`
  )
  return result
}

export async function findSimilarDuplicates(
  files: { id: string; filename: string; size: number }[]
): Promise<{ groups: { reason: string; file_ids: string[] }[] }> {
  const result = await groqRequest(
    'You analyze a list of files and detect potential duplicates that have different filenames but similar content (e.g., "photo(1).jpg" vs "IMG_001.jpg", "report-final.pdf" vs "report_v2.pdf"). Group files that are likely the same content. Return JSON: { "groups": [{ "reason": string explaining the similarity, "file_ids": string[] of file IDs that are duplicates }] }',
    `Files: ${JSON.stringify(files)}`
  )
  return result
}

export async function suggestFolderGroups(
  files: { filename: string; mimeType: string; id: string }[]
): Promise<{ suggestions: { folder_name: string; file_ids: string[]; reason: string }[] }> {
  const result = await groqRequest(
    'You analyze a list of files and suggest folder groupings. Return JSON: { "suggestions": [{ "folder_name": string, "file_ids": string[], "reason": string }] }',
    `Files: ${JSON.stringify(files)}`
  )
  return result
}
