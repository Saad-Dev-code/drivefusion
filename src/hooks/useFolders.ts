import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { VirtualFolder } from '@/types'

async function fetchFolders(): Promise<VirtualFolder[]> {
  const res = await fetch('/api/folders')
  if (!res.ok) throw new Error('Failed to fetch folders')
  const data = await res.json()
  return data.folders || []
}

async function createFolder(name: string, parentId?: string | null): Promise<VirtualFolder> {
  const res = await fetch('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent_id: parentId }),
  })
  if (!res.ok) throw new Error('Failed to create folder')
  const data = await res.json()
  return data.folder
}

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
    staleTime: 30 * 1000,
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string | null }) =>
      createFolder(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}
