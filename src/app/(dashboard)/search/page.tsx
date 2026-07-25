'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useFiles } from '@/hooks/useFiles'
import { useAiSearch } from '@/hooks/useAiSearch'
import { formatBytes, formatDate } from '@/lib/utils/formatting'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  const initialTag = searchParams.get('tag') || ''
  const [query, setQuery] = useState(initialQuery)
  const [useAi, setUseAi] = useState(true)

  const { data: textResults, isLoading: textLoading } = useFiles({
    search: useAi ? undefined : query,
    tag: initialTag || undefined,
    limit: 50,
  })

  const { data: aiResults, isLoading: aiLoading, error: aiError } = useAiSearch(
    useAi ? query : ''
  )

  const isLoading = useAi ? aiLoading : textLoading
  const results = useAi ? aiResults?.files : textResults

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-page-title font-bold text-on-surface">Search</h2>
          <button
            onClick={() => setUseAi(!useAi)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-body-sm font-semibold transition-all ${
              useAi
                ? 'bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white'
                : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            AI Search
          </button>
        </div>
        <p className="text-on-surface-variant text-body-sm mb-6">Search across all your connected drives</p>
        <form onSubmit={handleSearch} className="relative max-w-xl">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/20 text-body font-medium placeholder:text-outline transition-all outline-none"
            placeholder={useAi ? 'Try "my PDFs from last week" or "large images"...' : 'Search files by name...'}
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

      {initialTag && !initialQuery && (
        <div className="mb-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-semibold flex items-center gap-1">
            Tag: {initialTag}
            <a href="/search" className="ml-1 hover:text-primary/70">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </a>
          </span>
        </div>
      )}

      {/* AI Search filters */}
      {useAi && aiResults?.ai_transformed && initialQuery && (
        <div className="flex flex-wrap gap-2 mb-6">
          {aiResults.ai_transformed.filename_contains && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-semibold">
              Name: {aiResults.ai_transformed.filename_contains}
            </span>
          )}
          {aiResults.ai_transformed.mime_type && (
            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[11px] font-semibold">
              Type: {aiResults.ai_transformed.mime_type}
            </span>
          )}
          {aiResults.ai_transformed.min_size && (
            <span className="px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-[11px] font-semibold">
              Min: {formatBytes(aiResults.ai_transformed.min_size)}
            </span>
          )}
          {aiResults.ai_transformed.max_size && (
            <span className="px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-[11px] font-semibold">
              Max: {formatBytes(aiResults.ai_transformed.max_size)}
            </span>
          )}
          {aiResults.ai_transformed.tags?.map((tag: string) => (
            <span key={tag} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-semibold">
              Tag: {tag}
            </span>
          ))}
          {aiResults.ai_transformed.folder && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-semibold">
              Folder: {aiResults.ai_transformed.folder}
            </span>
          )}
          {aiResults.ai_transformed.date_range?.start && (
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[11px] font-semibold">
              From: {new Date(aiResults.ai_transformed.date_range.start).toLocaleDateString()}
            </span>
          )}
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
