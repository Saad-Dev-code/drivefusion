'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useStorage() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['storage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: accounts } = await supabase
        .from('google_accounts')
        .select('id, total_storage, used_storage, available_storage, google_email, google_name')
        .eq('user_id', user.id)

      const { data: files } = await supabase
        .from('files')
        .select('id, filename, size, mime_type')
        .eq('user_id', user.id)
        .order('size', { ascending: false })
        .limit(20)

      if (!accounts) return { accounts: [], largest_files: [], total_storage: 0, used_storage: 0, available_storage: 0 }

      const total_storage = accounts.reduce((s, a) => s + Number(a.total_storage), 0)
      const used_storage = accounts.reduce((s, a) => s + Number(a.used_storage), 0)
      const available_storage = accounts.reduce((s, a) => s + Number(a.available_storage), 0)

      return { accounts, total_storage, used_storage, available_storage, largest_files: files || [] }
    },
  })
}
