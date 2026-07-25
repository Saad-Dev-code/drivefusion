'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useFiles } from '@/hooks/useFiles'
import { formatBytes, formatDate } from '@/lib/utils/formatting'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)

  const { data: results, isLoading } = useFiles({ search: query, limit: 50 })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-page-title font-bold text-on-surface">Search</h2>
        <p className="text-on-surface-variant text-body-sm mb-6">Search across all your connected drives</p>
        <form onSubmit={handleSearch} className="relative max-w-xl">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/20 text-body font-medium placeholder:text-outline transition-all outline-none"
            placeholder="Search files by name..."
            autoFocus
          />
        </form>
      </div>

      {initialQuery && (
        <div className="mb-4">
          <p className="text-on-surface-variant text-body-sm">
            {isLoading ? 'Searching...' : `${results?.length || 0} result${results?.length !== 1 ? 's' : ''} for "${initialQuery}"`}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {results?.map((file) => (
          <div key={file.id} className="bg-surface-container-lowest p-4 rounded-[20px] premium-shadow flex items-center gap-4 border border-outline-variant/5">
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

      {initialQuery && results?.length === 0 && !isLoading && (
        <p className="text-center text-on-surface-variant py-16">No files found matching &quot;{initialQuery}&quot;.</p>
      )}

      {!initialQuery && (
        <p className="text-center text-on-surface-variant py-16">Enter a search term to find files across all your drives.</p>
      )}
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
