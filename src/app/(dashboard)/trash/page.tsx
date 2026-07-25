'use client'

import { useFiles, useRestoreFile, usePermanentDelete } from '@/hooks/useFiles'
import { formatBytes, formatDate } from '@/lib/utils/formatting'

export default function TrashPage() {
  const { data: files, isLoading } = useFiles({ trashed: true, limit: 100 })
  const restoreFile = useRestoreFile()
  const permanentDelete = usePermanentDelete()

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-page-title font-bold text-on-surface">Trash</h2>
        <p className="text-on-surface-variant text-body-sm">Deleted files are moved here</p>
      </div>

      <div className="bg-surface-container-lowest rounded-[24px] premium-shadow overflow-hidden">
        <div className="divide-y divide-surface-container-low">
          {files?.map((file) => (
            <div key={file.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-error-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-error text-[20px]">delete_sweep</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-body text-on-surface leading-tight truncate">{file.filename}</h4>
                <p className="text-label text-on-surface-variant">{formatBytes(file.size)} &bull; {formatDate(file.updated_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => restoreFile.mutate(file.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-body-sm font-semibold hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">restore</span>
                  Restore
                </button>
                <button
                  onClick={() => {
                    if (confirm('Permanently delete this file? This cannot be undone.')) {
                      permanentDelete.mutate(file.id)
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 text-error rounded-xl text-body-sm font-semibold hover:bg-error/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  Delete forever
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(!files || files.length === 0) && !isLoading && (
        <p className="text-center text-on-surface-variant py-16">Trash is empty.</p>
      )}
    </div>
  )
}
