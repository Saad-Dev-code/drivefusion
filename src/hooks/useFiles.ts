'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { FileRecord } from '@/types'

export function useFiles(params?: { folder?: string; search?: string; type?: string; page?: number; limit?: number }) {
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

      if (params?.folder) query.eq('virtual_folder_id', params.folder)
      if (params?.search) query.ilike('filename', `%${params.search}%`)
      if (params?.type) query.eq('mime_type', params.type)

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
  const supabase = createClient()

  return useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase.from('files').delete().eq('id', fileId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useRenameFile() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ fileId, filename }: { fileId: string; filename: string }) => {
      const { error } = await supabase.from('files').update({ filename }).eq('id', fileId)
      if (error) throw error
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
