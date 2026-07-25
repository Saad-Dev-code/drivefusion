'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UploadQueueItem } from '@/types'

export function useUpload() {
  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const queryClient = useQueryClient()
  const supabase = createClient()

  const uploadFile = useCallback(async (file: File, virtualFolderId?: string) => {
    const id = crypto.randomUUID()
    const item: UploadQueueItem = { id, file, progress: 0, status: 'pending' }
    setQueue(prev => [...prev, item])

    try {
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'uploading', progress: 20 } : i))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const formData = new FormData()
      formData.append('file', file)
      if (virtualFolderId) formData.append('virtual_folder_id', virtualFolderId)

      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()

      setQueue(prev => prev.map(i => i.id === id ? { ...i, progress: 80, status: 'processing' } : i))

      await fetch('/api/ai/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: data.id }),
      })

      setQueue(prev => prev.map(i => i.id === id ? { ...i, progress: 100, status: 'done', result: data } : i))
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['storage'] })
    } catch (err) {
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: (err as Error).message } : i))
    }
  }, [supabase, queryClient])

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(i => i.id !== id))
  }, [])

  return { queue, uploadFile, removeFromQueue }
}
