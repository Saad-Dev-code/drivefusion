'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { GoogleAccount } from '@/types'

export function useAccounts() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['google_accounts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('google_accounts')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      return data as GoogleAccount[]
    },
  })
}

export function useDisconnectAccount() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase.from('google_accounts').delete().eq('id', accountId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['storage'] })
    },
  })
}
