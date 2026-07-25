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
      const { data: account } = await supabase
        .from('google_accounts')
        .select('refresh_token')
        .eq('id', accountId)
        .single()

      if (account?.refresh_token) {
        try {
          const { decrypt } = await import('@/lib/utils/encryption')
          const token = decrypt(account.refresh_token)
          await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' })
        } catch {
          // Revocation failure is non-critical
        }
      }

      const { error } = await supabase.from('google_accounts').delete().eq('id', accountId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['storage'] })
    },
  })
}
