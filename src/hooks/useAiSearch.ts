'use client'

import { useQuery } from '@tanstack/react-query'
import type { SearchResult } from '@/types'

async function fetchAiSearch(query: string): Promise<SearchResult> {
  const res = await fetch('/api/ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error('AI search failed')
  return res.json()
}

export function useAiSearch(query: string) {
  return useQuery({
    queryKey: ['ai-search', query],
    queryFn: () => fetchAiSearch(query),
    enabled: query.length > 0,
    staleTime: 30 * 1000,
    retry: 1,
  })
}
