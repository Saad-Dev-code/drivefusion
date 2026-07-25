'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { FileRecord } from '@/types'

export function useFiles(params?: { folder?: string; search?: string; type?: string; page?: number; limit?: number; starred?: boolean; trashed?: boolean; tag?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['files', params],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const query = supabase
        .from('files')
        .select('*, tags:ai_tags(*), google_account:google_accounts(google_email, google_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (params?.trashed) {
        query.not('deleted_at', 'is', null)
      } else {
        query.is('deleted_at', null)
      }

      if (params?.starred) query.eq('starred', true)
      if (params?.folder) query.eq('virtual_folder_id', params.folder)
      if (params?.search) query.ilike('filename', `%${params.search}%`)
      if (params?.type) query.eq('mime_type', params.type)
      if (params?.tag) {
        const { data: tagFileIds } = await supabase
          .from('ai_tags')
          .select('file_id')
          .eq('tag', params.tag)
        if (tagFileIds && tagFileIds.length > 0) {
          query.in('id', [...new Set(tagFileIds.map(f => f.file_id))])
        } else {
          query.in('id', [])
        }
      }

      const page = params?.page || 1
      const limit = params?.limit || 50
      query.range((page - 1) * limit, page * limit - 1)

      const { data, error } = await query
      if (error) throw error
      return data as FileRecord[]
    },
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete file')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['storage'] })
    },
  })
}

export function usePermanentDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/files/${fileId}?permanent=true`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to permanently delete file')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['storage'] })
    },
  })
}

export function useRestoreFile() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase.from('files').update({ deleted_at: null }).eq('id', fileId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useRenameFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fileId, filename }: { fileId: string; filename: string }) => {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      if (!res.ok) throw new Error('Failed to rename file')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useStarFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fileId, starred }: { fileId: string; starred: boolean }) => {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred }),
      })
      if (!res.ok) throw new Error('Failed to update file star')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useMoveFile() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ fileId, folderId }: { fileId: string; folderId: string | null }) => {
      const { error } = await supabase.from('files').update({ virtual_folder_id: folderId }).eq('id', fileId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}
