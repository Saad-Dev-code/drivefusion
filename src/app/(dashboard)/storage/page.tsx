'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStorage } from '@/hooks/useStorage'
import { useAccounts, useDisconnectAccount } from '@/hooks/useAccounts'
import { useAiInsights } from '@/hooks/useAiInsights'
import { formatBytes } from '@/lib/utils/formatting'

export default function StoragePage() {
  const { data: storage, isLoading } = useStorage()
  const { data: accounts } = useAccounts()
  const disconnectAccount = useDisconnectAccount()
  const { data: insights } = useAiInsights()
  const queryClient = useQueryClient()
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const usedPercent = storage ? Math.round((storage.used_storage / (storage.total_storage || 1)) * 100) : 0

  return (
    <div>
      {/* Summary Overview */}
      <section className="mb-section-gap">
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[24px] premium-shadow border border-white/40">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h3 className="text-label text-on-surface-variant uppercase tracking-widest mb-2">Total Combined Storage</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-large-title font-bold text-on-surface">
                  {storage ? formatBytes(storage.used_storage) : '---'}
                </span>
                <span className="text-page-title text-on-surface-variant/40">
                  / {storage ? formatBytes(storage.total_storage) : '---'}
                </span>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-body-sm text-on-surface-variant">Used ({usedPercent}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-outline-variant/40" />
                <span className="text-body-sm text-on-surface-variant">Available</span>
              </div>
            </div>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="relative w-full h-8 bg-surface-container-high rounded-full overflow-hidden flex mb-8">
            {accounts?.map((account, i) => {
              const pct = storage?.total_storage ? (Number(account.used_storage) / storage.total_storage) * 100 : 0
              const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary-container', 'bg-[#5846c8]']
              return (
                <div
                  key={account.id}
                  className={`h-full ${colors[i % colors.length]} border-r border-white/20 transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>

          {/* Accounts Breakdown */}
          {accounts && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {accounts.map((account, i) => {
                const colors = ['text-primary', 'text-secondary', 'text-tertiary-container', 'text-[#5846c8]']
                return (
                  <div key={account.id} className="flex flex-col">
                    <span className="text-label text-on-surface-variant mb-1">{account.google_name || 'Account'}</span>
                    <span className={`text-headline font-semibold ${colors[i % colors.length]}`}>
                      {formatBytes(Number(account.used_storage))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
        {/* Connected Drives */}
        <div className="lg:col-span-2 flex flex-col gap-gutter">
          <h3 className="text-headline font-semibold text-on-surface">Connected Drives</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-gap">
            {accounts?.map((account) => {
              const pct = Math.round((Number(account.used_storage) / (Number(account.total_storage) || 1)) * 100)
              return (
                <div key={account.id} className="bg-surface-container-lowest p-6 rounded-[24px] premium-shadow border border-white/60 hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex justify-between items-start gap-2 mb-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[32px]">cloud</span>
                      </div>
                      <div>
                        <p className="text-body font-bold text-on-surface">{account.google_name || 'Google Drive'}</p>
                        <p className="text-body-sm text-on-surface-variant">{account.google_email}</p>
                      </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full tracking-wider">
                      Synced
                    </span>
                  </div>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-body-sm text-on-surface-variant">
                        {formatBytes(Number(account.used_storage))} used
                      </span>
                      <span className="text-body-sm font-bold text-on-surface">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
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
                        queryClient.invalidateQueries({ queryKey: ['storage'] })
                        queryClient.invalidateQueries({ queryKey: ['google_accounts'] })
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
                </div>
              )
            })}
          </div>

          {(!accounts || accounts.length === 0) && !isLoading && (
            <p className="text-center text-on-surface-variant py-16">No accounts connected. Add a Google Drive account to get started.</p>
          )}
        </div>

        {/* AI Insights Sidebar */}
        <aside className="flex flex-col gap-6 sticky top-24">
          {insights && insights.length > 0 && (
            <div className="relative bg-surface-container-lowest rounded-[24px] premium-shadow p-8 overflow-hidden border border-primary/10">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[80px]">auto_awesome</span>
              </div>
              <div className="flex items-center gap-3 text-primary mb-2">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h4 className="text-headline font-bold">AI Insight</h4>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {insights[0]?.description || 'No insights available.'}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-surface-container-low p-6 rounded-[24px] border border-outline-variant/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-body font-bold text-on-surface">Quick Stats</h4>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">info</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-on-surface-variant">Connected Drives</span>
                <span className="text-body-sm font-bold">{accounts?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-on-surface-variant">Used Storage</span>
                <span className="text-body-sm font-bold text-primary">{storage ? formatBytes(storage.used_storage) : '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-on-surface-variant">Available</span>
                <span className="text-body-sm font-bold">{storage ? formatBytes(storage.available_storage) : '---'}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
