'use client'

import { useFiles, useStarFile } from '@/hooks/useFiles'
import { formatBytes, formatDate } from '@/lib/utils/formatting'

export default function FavoritesPage() {
  const { data: files, isLoading } = useFiles({ starred: true, limit: 100 })
  const starFile = useStarFile()

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-page-title font-bold text-on-surface">Favorites</h2>
        <p className="text-on-surface-variant text-body-sm">Your starred files and folders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {files?.map((file) => (
          <div key={file.id} className="bg-surface-container-lowest p-5 rounded-[24px] premium-shadow border border-outline-variant/10 hover:-translate-y-1 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <button
                onClick={() => starFile.mutate({ fileId: file.id, starred: false })}
                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors opacity-0 group-hover:opacity-100"
                title="Unstar"
              >
                <span className="material-symbols-outlined text-[18px]">star</span>
              </button>
            </div>
            <h5 className="text-body font-bold text-on-surface truncate">{file.filename}</h5>
            <p className="text-label text-on-surface-variant mt-1">{formatBytes(file.size)} &bull; {formatDate(file.updated_at)}</p>
            <div className="flex items-center gap-2 mt-2">
              {file.google_account && (
                <span className="px-2 py-0.5 bg-surface-variant text-[10px] font-bold rounded-full text-on-surface-variant uppercase">
                  {file.google_account.google_name || 'Drive'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!files || files.length === 0) && !isLoading && (
        <p className="text-center text-on-surface-variant py-16">No favorites yet. Star files to see them here.</p>
      )}
    </div>
  )
}
