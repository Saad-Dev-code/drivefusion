'use client'

import { useFiles } from '@/hooks/useFiles'
import { formatBytes, formatDate } from '@/lib/utils/formatting'

export default function FavoritesPage() {
  const { data: files, isLoading } = useFiles({ limit: 100 })

  const favorites = files?.filter(f => f.tags?.some(t => t.tag === 'favorite')) || []

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-page-title font-bold text-on-surface">Favorites</h2>
        <p className="text-on-surface-variant text-body-sm">Your starred files and folders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {favorites.map((file) => (
          <div key={file.id} className="bg-surface-container-lowest p-5 rounded-[24px] premium-shadow border border-outline-variant/10 hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-amber-500 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <h5 className="text-body font-bold text-on-surface truncate">{file.filename}</h5>
            <p className="text-label text-on-surface-variant mt-1">{formatBytes(file.size)} &bull; {formatDate(file.updated_at)}</p>
          </div>
        ))}
      </div>

      {favorites.length === 0 && !isLoading && (
        <p className="text-center text-on-surface-variant py-16">No favorites yet. Star files to see them here.</p>
      )}
    </div>
  )
}
