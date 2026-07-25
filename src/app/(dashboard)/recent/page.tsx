'use client'

import { useFiles } from '@/hooks/useFiles'
import { formatBytes, formatDate } from '@/lib/utils/formatting'

export default function RecentPage() {
  const { data: files, isLoading } = useFiles({ limit: 100 })

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-page-title font-bold text-on-surface">Recent Files</h2>
        <p className="text-on-surface-variant text-body-sm">Recently modified files across all drives</p>
      </div>

      <div className="space-y-4">
        {files?.map((file) => (
          <div key={file.id} className="bg-surface-container-lowest p-4 rounded-[20px] premium-shadow flex items-center gap-4 border border-outline-variant/5 hover:-translate-y-0.5 transition-all">
            <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
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
            <div className="flex items-center gap-2 shrink-0">
              {file.google_account && (
                <span className="px-3 py-1 bg-surface-variant text-[10px] font-bold rounded-full text-on-surface-variant uppercase">
                  {file.google_account.google_name || 'Drive'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!files || files.length === 0) && !isLoading && (
        <p className="text-center text-on-surface-variant py-16">No recent files found.</p>
      )}
    </div>
  )
}
