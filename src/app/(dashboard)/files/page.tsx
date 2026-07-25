'use client'

import { useState, useCallback } from 'react'
import { useFiles, useDeleteFile } from '@/hooks/useFiles'
import { formatBytes, formatDate } from '@/lib/utils/formatting'

export default function FilesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { data: files, isLoading } = useFiles()
  const deleteFile = useDeleteFile()

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (files && selected.size === files.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(files?.map(f => f.id) || []))
    }
  }

  const handleDeleteSelected = () => {
    if (selected.size === 0) return
    selected.forEach(id => deleteFile.mutate(id))
    setSelected(new Set())
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 mb-4 text-on-surface-variant text-body-sm">
        <span className="hover:text-primary transition-colors cursor-pointer">My Files</span>
      </nav>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-page-title font-bold text-on-surface">My Files</h2>
          <p className="text-on-surface-variant text-body-sm">{files?.length || 0} items</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('drivefusion:open-upload'))}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white font-bold text-body-sm premium-shadow hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">upload</span>
            <span className="hidden sm:inline">Upload</span>
          </button>
          <div className="flex p-1 bg-surface-container rounded-xl">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-[20px]">list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Files Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-headline font-semibold text-on-surface">All Files</h3>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {files?.map((file) => (
              <div
                key={file.id}
                onClick={() => toggleSelect(file.id)}
                className={`bg-surface-container-lowest p-5 rounded-[24px] premium-shadow cursor-pointer transition-all border ${
                  selected.has(file.id) ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/10 hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {file.mime_type?.includes('pdf') ? 'description' : file.mime_type?.includes('image') ? 'image' : file.mime_type?.includes('zip') ? 'folder_zip' : 'article'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected.has(file.id)}
                    onChange={() => toggleSelect(file.id)}
                    className="rounded-md border-outline-variant text-primary focus:ring-primary"
                  />
                </div>
                <h5 className="text-body font-bold text-on-surface truncate">{file.filename}</h5>
                <p className="text-label text-on-surface-variant mt-1">{formatBytes(file.size)} &bull; {formatDate(file.updated_at)}</p>
                {file.google_account && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-surface-variant text-[10px] font-bold rounded-full text-on-surface-variant uppercase">
                    {file.google_account.google_name || 'Drive'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="bg-surface-container-lowest rounded-[24px] premium-shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="py-5 px-8 w-12">
                    <input
                      type="checkbox"
                      checked={files ? selected.size === files.length : false}
                      onChange={selectAll}
                      className="rounded-md border-outline-variant text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="py-5 px-4 text-label text-outline uppercase tracking-widest">Name</th>
                  <th className="py-5 px-4 text-label text-outline uppercase tracking-widest hidden md:table-cell">Source</th>
                  <th className="py-5 px-4 text-label text-outline uppercase tracking-widest hidden md:table-cell">Size</th>
                  <th className="py-5 px-4 text-label text-outline uppercase tracking-widest hidden md:table-cell">Modified</th>
                </tr>
              </thead>
              <tbody>
                {files?.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`group hover:bg-surface-container-low transition-colors cursor-pointer border-b border-surface-container-low last:border-0 ${
                      selected.has(file.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-4 px-8">
                      <input
                        type="checkbox"
                        checked={selected.has(file.id)}
                        onChange={() => toggleSelect(file.id)}
                        className="rounded-md border-outline-variant text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">
                            {file.mime_type?.includes('pdf') ? 'description' : file.mime_type?.includes('image') ? 'image' : file.mime_type?.includes('zip') ? 'folder_zip' : 'article'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm text-on-surface group-hover:text-primary transition-colors truncate">{file.filename}</p>
                          <p className="text-[11px] text-outline">{file.mime_type?.split('/').pop()?.toUpperCase() || 'File'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface-variant text-[13px]">{file.google_account?.google_name || 'Drive'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant text-[13px] hidden md:table-cell">{formatBytes(file.size)}</td>
                    <td className="py-4 px-4 text-on-surface-variant text-[13px] hidden md:table-cell">{formatDate(file.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(!files || files.length === 0) && !isLoading && (
          <p className="text-center text-on-surface-variant py-16">No files yet. Upload your first file to get started.</p>
        )}
      </section>

      {/* Bulk Action Toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-36 lg:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-inverse-surface text-inverse-on-surface shadow-2xl backdrop-blur-xl z-50">
          <div className="px-4 py-2 border-r border-white/10">
            <p className="text-body-sm font-medium">{selected.size} selected</p>
          </div>
          <div className="flex items-center gap-1 p-1">
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-error-container"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
              <span className="text-body-sm">Delete</span>
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} className="p-2 ml-2 hover:bg-white/10 rounded-xl">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
    </div>
  )
}
