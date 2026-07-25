'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAccounts, useDisconnectAccount } from '@/hooks/useAccounts'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatBytes } from '@/lib/utils/formatting'

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts()
  const disconnectAccount = useDisconnectAccount()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const handleConnectDrive = () => {
    setConnecting(true)
    window.location.href = '/api/auth/google'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-page-title font-bold text-on-surface">Connected Drives</h2>
          <p className="text-on-surface-variant text-body-sm">Manage your connected cloud storage accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-[16px] font-semibold premium-shadow hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Connect New Drive
        </button>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {accounts?.map((account) => {
          const pct = Math.round((Number(account.used_storage) / (Number(account.total_storage) || 1)) * 100)
          return (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[32px]">cloud</span>
                    </div>
                    <div>
                      <p className="text-body font-bold text-on-surface">{account.google_name || 'Google Drive'}</p>
                      <p className="text-body-sm text-on-surface-variant">{account.google_email}</p>
                    </div>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body-sm text-on-surface-variant">
                      {formatBytes(Number(account.used_storage))} of {formatBytes(Number(account.total_storage))} used
                    </span>
                    <span className="text-body-sm font-bold text-on-surface">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      setRefreshingId(account.id)
                      await fetch('/api/storage/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accountId: account.id }),
                      })
                      queryClient.invalidateQueries({ queryKey: ['google_accounts'] })
                      queryClient.invalidateQueries({ queryKey: ['storage'] })
                      setTimeout(() => setRefreshingId(null), 1000)
                    }}
                    disabled={refreshingId === account.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-outline-variant/30 rounded-xl text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-60"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${refreshingId === account.id ? 'animate-spin' : ''}`}>refresh</span>
                    {refreshingId === account.id ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={() => disconnectAccount.mutate(account.id)}
                    className="px-3 py-2.5 border border-outline-variant/30 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(!accounts || accounts.length === 0) && !isLoading && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-[64px] text-outline mb-4">cloud_off</span>
          <p className="text-headline font-semibold text-on-surface mb-2">No drives connected</p>
          <p className="text-body text-on-surface-variant mb-8">Connect your first Google Drive to get started.</p>
        </div>
      )}

      {/* Connect Drive Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-on-background/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-[24px] premium-shadow border border-white/40 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-headline text-on-surface font-semibold">Connect New Drive</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              <p className="text-body-sm text-on-surface-variant mb-6">Select a cloud provider to sync your files with Drive Fusion.</p>
              <div className="space-y-3 mb-8">
                <button
                  onClick={handleConnectDrive}
                  disabled={connecting}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-body-sm font-bold text-on-surface">Google Drive</p>
                    <p className="text-[12px] text-on-surface-variant/70">Recommended</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConnectDrive}
                  disabled={connecting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-xl font-semibold text-body-sm premium-shadow hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {connecting ? 'Connecting...' : 'Continue to Google'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3.5 text-on-surface-variant font-semibold text-body-sm hover:bg-surface-container-low rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
