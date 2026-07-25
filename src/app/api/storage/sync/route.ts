import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStorageQuota } from '@/lib/google/drive'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const accountId = body.accountId as string | undefined

    let accounts: { id: string }[]
    if (accountId) {
      accounts = [{ id: accountId }]
    } else {
      const { data: allAccounts } = await supabase
        .from('google_accounts')
        .select('id')
        .eq('user_id', user.id)
      accounts = allAccounts || []
    }

    const results: { id: string; success: boolean; error?: string }[] = []

    for (const account of accounts) {
      try {
        const quota = await getStorageQuota(account.id)
        if (!quota) {
          results.push({ id: account.id, success: false, error: 'No quota data' })
          continue
        }
        const total = parseInt(quota.limit || '0', 10)
        const used = parseInt(quota.usage || '0', 10)

        await supabase
          .from('google_accounts')
          .update({
            total_storage: total,
            used_storage: used,
            available_storage: total - used,
          })
          .eq('id', account.id)

        results.push({ id: account.id, success: true })
      } catch {
        results.push({ id: account.id, success: false, error: 'Sync failed' })
      }
    }

    return NextResponse.json({ synced: results.length, results })
  } catch {
    return NextResponse.json({ error: 'Storage sync failed' }, { status: 500 })
  }
}
