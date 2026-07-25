'use client'

import { useState } from 'react'
import { useAllFolders } from '@/hooks/useFolders'

interface FolderPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (folderId: string | null) => void
  title?: string
}

export default function FolderPicker({ open, onClose, onSelect, title }: FolderPickerProps) {
  const { data: folders, isLoading } = useAllFolders()
  const [search, setSearch] = useState('')

  if (!open) return null

  const filtered = (folders || []).filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-[24px] premium-shadow border border-white/40 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline text-on-surface font-semibold">
              {title || 'Move to folder'}
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
            </button>
          </div>

          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search folders..."
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-body-sm font-medium placeholder:text-outline outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            <button
              onClick={() => { onSelect(null); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">folder_open</span>
              <span className="text-body-sm font-semibold text-on-surface">Root (no folder)</span>
            </button>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}

            {filtered.map((folder) => (
              <button
                key={folder.id}
                onClick={() => { onSelect(folder.id); onClose() }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-amber-600">folder</span>
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-on-surface truncate">{folder.name}</p>
                </div>
              </button>
            ))}

            {!isLoading && filtered.length === 0 && (
              <p className="text-center text-body-sm text-on-surface-variant py-8">
                {search ? 'No folders match your search' : 'No folders yet'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
