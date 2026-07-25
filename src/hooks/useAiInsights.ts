import { useQuery } from '@tanstack/react-query'
import type { AiInsight } from '@/types'

async function fetchAiInsights(): Promise<AiInsight[]> {
  const res = await fetch('/api/ai/insights')
  if (!res.ok) throw new Error('Failed to fetch insights')
  const data = await res.json()
  return data.insights || []
}

export function useAiInsights() {
  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: fetchAiInsights,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
