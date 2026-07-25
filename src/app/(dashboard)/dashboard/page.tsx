'use client'

import { useStorage } from '@/hooks/useStorage'
import { useAiInsights } from '@/hooks/useAiInsights'
import { useFiles } from '@/hooks/useFiles'
import Link from 'next/link'
import { formatBytes, formatDate } from '@/lib/utils/formatting'

export default function DashboardPage() {
  const { data: storage, isLoading: storageLoading } = useStorage()
  const { data: insights } = useAiInsights()
  const { data: recentFiles } = useFiles({ limit: 5 })

  const usedPercent = storage ? Math.round((storage.used_storage / (storage.total_storage || 1)) * 100) : 0

  return (
    <div className="space-y-section-gap">
      {/* Storage Analytics Hero */}
      <section>
        <div className="bg-surface-container-lowest rounded-[24px] premium-shadow p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-label mb-4 uppercase tracking-wider">
              Dashboard Overview
            </span>
            <h2 className="text-large-title font-bold text-on-surface mb-2">Storage Analytics</h2>
            <p className="text-body text-on-surface-variant mb-6 max-w-md">
              Your cloud ecosystem is currently aggregating {storage?.accounts?.length || 0} account{storage?.accounts?.length !== 1 ? 's' : ''} connected.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('drivefusion:open-upload'))}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white font-bold text-body-sm premium-shadow hover:opacity-90 transition-all mb-8"
            >
              <span className="material-symbols-outlined text-[20px]">upload</span>
              <span>Upload Files</span>
            </button>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low rounded-[20px] border border-outline-variant/20">
                <p className="text-label text-on-surface-variant uppercase mb-1">Available</p>
                <p className="text-page-title text-primary font-extrabold">
                  {storage ? formatBytes(storage.available_storage) : '---'}
                </p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-[20px] border border-outline-variant/20">
                <p className="text-label text-on-surface-variant uppercase mb-1">Total Capacity</p>
                <p className="text-page-title text-on-surface font-extrabold">
                  {storage ? formatBytes(storage.total_storage) : '---'}
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto flex justify-center items-center relative p-4">
            <div className="w-64 h-64 rounded-full border-[24px] border-surface-container-high relative flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" fill="transparent" r="108" stroke="#4d41df" strokeDasharray="678" strokeDashoffset={678 - (678 * usedPercent) / 100} strokeLinecap="round" strokeWidth="24" />
                <circle cx="50%" cy="50%" fill="transparent" r="108" stroke="#b65c00" strokeDasharray="678" strokeDashoffset={678 - (678 * Math.min(usedPercent * 0.15, 15)) / 100} strokeLinecap="round" strokeWidth="24" />
              </svg>
              <div className="text-center">
                <p className="text-large-title font-black text-on-surface">{usedPercent}%</p>
                <p className="text-label text-on-surface-variant">UTILIZED</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="text-headline font-semibold text-on-surface">AI Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className="relative bg-surface-container-lowest rounded-[24px] premium-shadow p-8 overflow-hidden border border-primary/10">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {insight.type === 'duplicate' ? 'content_copy' : insight.type === 'storage' ? 'storage' : 'folder_managed'}
                    </span>
                  </div>
                  <span className="text-label uppercase text-on-surface-variant">{insight.severity}</span>
                </div>
                <h4 className="text-headline font-semibold text-on-surface mb-2">{insight.title}</h4>
                <p className="text-body text-on-surface-variant mb-6">{insight.description}</p>
                {insight.action && (
                  <button className="w-full py-4 bg-primary text-on-primary rounded-[16px] font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    {insight.action}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-headline font-semibold text-on-surface">Recent Activity</h3>
          <Link href="/recent" className="text-primary font-bold text-body-sm hover:underline">View All</Link>
        </div>

        {/* Recent Files */}
        <div className="space-y-4">
          {recentFiles?.slice(0, 3).map((file) => (
            <div key={file.id} className="bg-surface-container-lowest p-4 rounded-[20px] premium-shadow flex items-center gap-4 border border-outline-variant/5">
              <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {file.mime_type?.includes('pdf') ? 'description' : file.mime_type?.includes('image') ? 'image' : file.mime_type?.includes('zip') ? 'folder_zip' : 'article'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h6 className="text-body font-bold text-on-surface truncate">{file.filename}</h6>
                <p className="text-label text-on-surface-variant">
                  {formatDate(file.updated_at)} &bull; {formatBytes(file.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {file.google_account && (
                  <span className="px-3 py-1 bg-surface-variant text-[10px] font-bold rounded-full text-on-surface-variant uppercase">
                    {file.google_account.google_name?.includes('gmail') ? 'GDRIVE' : 'DRIVE'}
                  </span>
                )}
              </div>
            </div>
          ))}
          {(!recentFiles || recentFiles.length === 0) && !storageLoading && (
            <p className="text-center text-on-surface-variant py-12">No files yet. Upload your first file to get started.</p>
          )}
        </div>
      </section>
    </div>
  )
}
