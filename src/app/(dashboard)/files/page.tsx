'use client'

import { useState, useCallback, useEffect } from 'react'
import { useFiles, useDeleteFile, useRenameFile, useStarFile, useMoveFile } from '@/hooks/useFiles'
import { useFolders, useCreateFolder } from '@/hooks/useFolders'
import { formatBytes, formatDate } from '@/lib/utils/formatting'
import { useQueryClient } from '@tanstack/react-query'
import FolderPicker from '@/components/ui/FolderPicker'

export default function FilesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [suggestions, setSuggestions] = useState<{ folder_name: string; file_ids: string[]; reason: string }[] | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'My Files' }])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [pickMode, setPickMode] = useState<'single' | 'bulk'>('single')
  const [pickFileId, setPickFileId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [deleteFolderName, setDeleteFolderName] = useState('')
  const [deleteMode, setDeleteMode] = useState<'keep' | 'delete'>('keep')
  const [deletingFolder, setDeletingFolder] = useState(false)
  const [scanResults, setScanResults] = useState<{
    groups: { filename: string; size: number; occurrences: number; folders: (string | null)[]; files: { id: string; folder_name: string | null }[]; type: string }[]
    total: number
    new_tags: number
  } | null>(null)
  const [scanning, setScanning] = useState(false)
  const [showScanPanel, setShowScanPanel] = useState(false)

  const { data: files, isLoading } = useFiles({ folder: currentFolderId || undefined, page })
  const { data: subFolders } = useFolders(currentFolderId)
  const deleteFile = useDeleteFile()
  const renameFile = useRenameFile()
  const starFile = useStarFile()
  const moveFile = useMoveFile()
  const createFolder = useCreateFolder()
  const queryClient = useQueryClient()
  const limit = 50

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId)
    setFolderPath(prev => [...prev, { id: folderId, name: folderName }])
    setPage(1)
    setSelected(new Set())
  }

  const navigateToPath = (index: number) => {
    const newPath = folderPath.slice(0, index + 1)
    setFolderPath(newPath)
    setCurrentFolderId(newPath[newPath.length - 1].id)
    setPage(1)
    setSelected(new Set())
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    createFolder.mutate(
      { name: newFolderName.trim(), parentId: currentFolderId },
      { onSuccess: () => { setShowNewFolder(false); setNewFolderName('') } }
    )
  }

  const handleDeleteFolder = async () => {
    if (!showDeleteDialog) return
    setDeletingFolder(true)
    try {
      const res = await fetch(`/api/folders/${showDeleteDialog}?mode=${deleteMode}`, { method: 'DELETE' })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['folders'] })
        queryClient.invalidateQueries({ queryKey: ['files'] })
        if (deleteMode === 'delete') queryClient.invalidateQueries({ queryKey: ['storage'] })
      }
    } catch { /* ignore */ }
    setDeletingFolder(false)
    setShowDeleteDialog(null)
    setDeleteMode('keep')
  }

  const handleScanDuplicates = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/ai/scan-duplicates', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setScanResults(data)
        setShowScanPanel(true)
        localStorage.setItem('df-last-dup-scan', Date.now().toString())
        queryClient.invalidateQueries({ queryKey: ['files'] })
      }
    } catch { /* ignore */ }
    setScanning(false)
  }

  useEffect(() => {
    const lastScan = localStorage.getItem('df-last-dup-scan')
    const sixHours = 6 * 60 * 60 * 1000
    if (!lastScan || Date.now() - parseInt(lastScan) > sixHours) {
      handleScanDuplicates()
    }
  }, [])

  const handleMoveToFolder = (folderId: string | null) => {
    if (pickMode === 'bulk') {
      selected.forEach(id => moveFile.mutate({ fileId: id, folderId }))
      setSelected(new Set())
    } else if (pickFileId) {
      moveFile.mutate({ fileId: pickFileId, folderId })
      setPickFileId(null)
    }
    queryClient.invalidateQueries({ queryKey: ['files'] })
    queryClient.invalidateQueries({ queryKey: ['folders'] })
  }

  const fetchSuggestions = async () => {
    setSuggesting(true)
    try {
      const res = await fetch('/api/ai/folder-suggestions')
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch {
      // Silently fail
    }
    setSuggesting(false)
  }

  const acceptSuggestion = async (suggestion: { folder_name: string; file_ids: string[] }) => {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: suggestion.folder_name }),
    })
    if (!res.ok) return
    const { folder } = await res.json()
    for (const fileId of suggestion.file_ids) {
      moveFile.mutate({ fileId, folderId: folder.id })
    }
    queryClient.invalidateQueries({ queryKey: ['files'] })
    queryClient.invalidateQueries({ queryKey: ['folders'] })
  }

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

  const startRename = (id: string, currentName: string) => {
    setRenaming(id)
    setRenameValue(currentName)
  }

  const submitRename = (id: string) => {
    if (renameValue.trim()) {
      renameFile.mutate({ fileId: id, filename: renameValue.trim() })
    }
    setRenaming(null)
  }

  const itemCount = (files?.length || 0) + (subFolders?.length || 0)

  return (
    <div>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 mb-4 text-body-sm text-on-surface-variant overflow-x-auto pb-1">
        {folderPath.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-outline">›</span>}
            <button
              onClick={() => navigateToPath(i)}
              className={`hover:text-primary transition-colors whitespace-nowrap ${
                i === folderPath.length - 1 ? 'text-on-surface font-semibold' : ''
              }`}
            >
              {item.name}
            </button>
          </div>
        ))}
      </nav>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-page-title font-bold text-on-surface">
            {folderPath[folderPath.length - 1]?.name || 'My Files'}
          </h2>
          <p className="text-on-surface-variant text-body-sm">{itemCount} items</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('drivefusion:open-upload'))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white font-bold text-body-sm premium-shadow hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">upload</span>
            <span className="hidden sm:inline">Upload</span>
          </button>
          <button
            onClick={handleScanDuplicates}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-container-low text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${scanning ? 'animate-spin' : ''}`}>scan</span>
            <span className="hidden sm:inline">Scan Duplicates</span>
          </button>
          <button
            onClick={fetchSuggestions}
            disabled={suggesting}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-container-low text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${suggesting ? 'animate-spin' : ''}`}>auto_awesome</span>
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

      {/* New Folder Inline */}
      {showNewFolder && (
        <div className="mb-6 bg-surface-container-lowest rounded-[20px] premium-shadow p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">create_new_folder</span>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') } }}
              placeholder="Folder name..."
              autoFocus
              className="flex-1 px-4 py-2.5 bg-surface-container-low rounded-xl text-body font-medium placeholder:text-outline outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolder.isPending}
              className="px-5 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-xl text-body-sm font-semibold premium-shadow hover:opacity-90 transition-all disabled:opacity-50"
            >
              {createFolder.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowNewFolder(false); setNewFolderName('') }}
              className="p-2.5 hover:bg-surface-container-low rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation */}
      {showDeleteDialog && (
        <div className="mb-6 bg-surface-container-lowest rounded-[20px] premium-shadow p-5 border border-error/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-[24px]">delete_sweep</span>
            <div className="flex-1">
              <h4 className="text-body font-bold text-on-surface mb-1">Delete &quot;{deleteFolderName}&quot;</h4>
              <p className="text-body-sm text-on-surface-variant mb-4">What should happen to files inside this folder?</p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all flex-1 ${
                  deleteMode === 'keep' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:bg-surface-container-low'
                }`}>
                  <input
                    type="radio"
                    name="deleteMode"
                    value="keep"
                    checked={deleteMode === 'keep'}
                    onChange={() => setDeleteMode('keep')}
                    className="text-primary"
                  />
                  <div>
                    <p className="text-body-sm font-semibold text-on-surface">Move files to parent</p>
                    <p className="text-[11px] text-on-surface-variant">Files remain accessible</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all flex-1 ${
                  deleteMode === 'delete' ? 'border-error bg-error/5' : 'border-outline-variant/30 hover:bg-surface-container-low'
                }`}>
                  <input
                    type="radio"
                    name="deleteMode"
                    value="delete"
                    checked={deleteMode === 'delete'}
                    onChange={() => setDeleteMode('delete')}
                    className="text-error"
                  />
                  <div>
                    <p className="text-body-sm font-semibold text-on-surface">Delete files too</p>
                    <p className="text-[11px] text-on-surface-variant">Can be restored from Trash</p>
                  </div>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteFolder}
                  disabled={deletingFolder}
                  className={`px-5 py-2.5 rounded-xl text-body-sm font-semibold text-white transition-all disabled:opacity-50 ${
                    deleteMode === 'delete' ? 'bg-error' : 'bg-primary'
                  }`}
                >
                  {deletingFolder ? 'Deleting...' : deleteMode === 'keep' ? 'Delete Folder' : 'Delete Folder & Files'}
                </button>
                <button
                  onClick={() => { setShowDeleteDialog(null); setDeleteMode('keep') }}
                  className="px-5 py-2.5 rounded-xl bg-surface-container-low text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-folders Grid */}
      {subFolders && subFolders.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {subFolders.map((folder) => (
              <div
                key={folder.id}
                className="relative group bg-surface-container-lowest p-4 rounded-[20px] premium-shadow border border-outline-variant/10 hover:border-primary/30 hover:-translate-y-0.5 transition-all"
              >
                <button
                  onClick={() => navigateToFolder(folder.id, folder.name)}
                  className="text-left w-full"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-amber-600 text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                  </div>
                  <p className="text-body-sm font-bold text-on-surface truncate">{folder.name}</p>
                  {folder.children && folder.children.length > 0 && (
                    <p className="text-[10px] text-outline mt-0.5">{folder.children.length} sub-folders</p>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(folder.id); setDeleteFolderName(folder.name) }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface/80 opacity-0 group-hover:opacity-100 text-outline hover:text-error hover:bg-error-container/20 transition-all"
                  title="Delete folder"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Scan Results Panel */}
      {showScanPanel && scanResults && (
        <div className="mb-8 bg-surface-container-lowest rounded-[20px] premium-shadow p-5 border border-secondary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">scan</span>
              <h4 className="text-headline font-semibold text-on-surface">Duplicate Files</h4>
            </div>
            <button onClick={() => setShowScanPanel(false)} className="p-1.5 rounded-lg text-outline hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-4">{scanResults.total} duplicate groups found ({scanResults.new_tags} newly tagged)</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {scanResults.groups.map((g, i) => (
              <details key={i} className="bg-surface-container rounded-xl p-3">
                <summary className="text-body-sm font-semibold text-on-surface cursor-pointer flex items-center gap-2">
                  <span className="text-outline">{g.type === 'exact' ? 'content_copy' : 'find_in_page'}</span>
                  {g.filename}
                  <span className="text-[11px] text-on-surface-variant font-normal">({g.occurrences} copies, {g.size ? formatBytes(g.size) : '?'})</span>
                </summary>
                <div className="mt-2 space-y-1.5 pl-2">
                  {g.files.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      <span className="truncate">{f.folder_name || 'Root'}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline font-semibold text-on-surface">
            {subFolders && subFolders.length > 0 ? 'Files' : 'All Files'}
          </h3>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {files?.map((file) => (
              <div
                key={file.id}
                className={`bg-surface-container-lowest p-5 rounded-[24px] premium-shadow transition-all border ${
                  selected.has(file.id) ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/10 hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {file.mime_type?.includes('pdf') ? 'description' : file.mime_type?.includes('image') ? 'image' : file.mime_type?.includes('zip') ? 'folder_zip' : 'article'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); starFile.mutate({ fileId: file.id, starred: !file.starred }) }}
                      className={`p-1.5 rounded-lg transition-colors ${file.starred ? 'text-amber-500' : 'text-outline hover:text-amber-400'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: file.starred ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={selected.has(file.id)}
                      onChange={() => toggleSelect(file.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md border-outline-variant text-primary focus:ring-primary"
                    />
                  </div>
                </div>
                {renaming === file.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => submitRename(file.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitRename(file.id); if (e.key === 'Escape') setRenaming(null) }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full px-2 py-1 bg-surface-container-low rounded-lg text-body font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 mb-1"
                  />
                ) : (
                  <h5
                    onClick={() => startRename(file.id, file.filename)}
                    className="text-body font-bold text-on-surface truncate cursor-pointer hover:text-primary transition-colors"
                    title="Click to rename"
                  >
                    {file.filename}
                  </h5>
                )}
                <p className="text-label text-on-surface-variant mt-1">{formatBytes(file.size)} &bull; {formatDate(file.updated_at)}</p>
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {file.tags.filter(t => t.tag !== 'duplicate').slice(0, 3).map((t) => (
                      <a
                        key={t.id}
                        href={`/search?tag=${encodeURIComponent(t.tag)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full hover:bg-primary/20 transition-colors"
                      >
                        {t.tag}
                      </a>
                    ))}
                    {file.tags.some(t => t.tag === 'duplicate') && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        Duplicate
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {file.google_account && (
                    <span className="px-2 py-0.5 bg-surface-variant text-[10px] font-bold rounded-full text-on-surface-variant uppercase">
                      {file.google_account.google_name || 'Drive'}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPickFileId(file.id); setPickMode('single'); setShowFolderPicker(true) }}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/5 transition-colors"
                      title="Move to folder"
                    >
                      <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                    </button>
                    <a
                      href={`/api/files/${file.id}/download`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/5 transition-colors"
                      title="Download"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="bg-surface-container-lowest rounded-[24px] premium-shadow overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="py-5 px-6 w-12">
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
                  <th className="py-5 px-4 text-label text-outline uppercase tracking-widest w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files?.map((file) => (
                  <tr
                    key={file.id}
                    className={`group hover:bg-surface-container-low transition-colors cursor-pointer border-b border-surface-container-low last:border-0 ${
                      selected.has(file.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selected.has(file.id)}
                        onChange={() => toggleSelect(file.id)}
                        className="rounded-md border-outline-variant text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3" onClick={() => toggleSelect(file.id)}>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {file.mime_type?.includes('pdf') ? 'description' : file.mime_type?.includes('image') ? 'image' : file.mime_type?.includes('zip') ? 'folder_zip' : 'article'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          {renaming === file.id ? (
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => submitRename(file.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') submitRename(file.id); if (e.key === 'Escape') setRenaming(null) }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="w-full px-2 py-1 bg-surface-container-low rounded text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ) : (
                            <>
                              <p
                                className="text-body-sm text-on-surface group-hover:text-primary transition-colors truncate"
                                onDoubleClick={() => startRename(file.id, file.filename)}
                              >
                                {file.filename}
                              </p>
                              <p className="text-[11px] text-outline">{file.mime_type?.split('/').pop()?.toUpperCase() || 'File'}</p>
                            </>
                          )}
                          {file.tags && file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {file.tags.filter(t => t.tag !== 'duplicate').slice(0, 2).map((t) => (
                                <a
                                  key={t.id}
                                  href={`/search?tag=${encodeURIComponent(t.tag)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-semibold rounded-full hover:bg-primary/20 transition-colors"
                                >
                                  {t.tag}
                                </a>
                              ))}
                              {file.tags.some(t => t.tag === 'duplicate') && (
                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-semibold rounded-full">
                                  Duplicate
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell" onClick={() => toggleSelect(file.id)}>
                      <span className="text-on-surface-variant text-[13px]">{file.google_account?.google_name || 'Drive'}</span>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant text-[13px] hidden md:table-cell" onClick={() => toggleSelect(file.id)}>{formatBytes(file.size)}</td>
                    <td className="py-4 px-4 text-on-surface-variant text-[13px] hidden md:table-cell" onClick={() => toggleSelect(file.id)}>{formatDate(file.updated_at)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); starFile.mutate({ fileId: file.id, starred: !file.starred }) }}
                          className={`p-1.5 rounded-lg transition-colors ${file.starred ? 'text-amber-500' : 'text-outline hover:text-amber-400'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: file.starred ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPickFileId(file.id); setPickMode('single'); setShowFolderPicker(true) }}
                          className="p-1.5 rounded-lg text-outline hover:text-primary transition-colors"
                          title="Move to folder"
                        >
                          <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
                        </button>
                        <a
                          href={`/api/files/${file.id}/download`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-outline hover:text-primary transition-colors"
                          title="Download"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(!files || files.length === 0) && (!subFolders || subFolders.length === 0) && !isLoading && (
          <p className="text-center text-on-surface-variant py-16">This folder is empty. Upload files or create a folder to get started.</p>
        )}
      </section>

      {/* Folder Suggestions Panel */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-8 bg-surface-container-lowest rounded-[24px] premium-shadow p-6 border border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
              <h3 className="text-headline font-semibold text-on-surface">Suggested Folders</h3>
            </div>
            <button onClick={() => setSuggestions(null)} className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((s, i) => (
              <div key={i} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">folder</span>
                  <h4 className="text-body font-bold text-on-surface">{s.folder_name}</h4>
                </div>
                <p className="text-body-sm text-on-surface-variant mb-3">{s.reason}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-outline">{s.file_ids.length} files</span>
                </div>
                <button
                  onClick={() => acceptSuggestion(s)}
                  className="mt-3 w-full py-2 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-xl text-body-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Create & Move
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {files && files.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container-low text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            Previous
          </button>
          <span className="text-body-sm text-on-surface-variant">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!files || files.length < limit}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container-low text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30"
          >
            Next
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-36 lg:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-inverse-surface text-inverse-on-surface shadow-2xl backdrop-blur-xl z-50">
          <div className="px-4 py-2 border-r border-white/10">
            <p className="text-body-sm font-medium">{selected.size} selected</p>
          </div>
          <div className="flex items-center gap-1 p-1">
            <button
              onClick={() => { setPickMode('bulk'); setShowFolderPicker(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">drive_file_move</span>
              <span className="text-body-sm">Move</span>
            </button>
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

      {/* Folder Picker Modal */}
      <FolderPicker
        open={showFolderPicker}
        onClose={() => { setShowFolderPicker(false); setPickFileId(null) }}
        onSelect={handleMoveToFolder}
        title="Move to folder"
      />

      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
    </div>
  )
}
