'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useUpload } from '@/hooks/useUpload'

export default function UploadDialog() {
  const { queue, uploadFile, removeFromQueue } = useUpload()
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isModalHover, setIsModalHover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = () => setShowUploadModal(true)
    window.addEventListener('drivefusion:open-upload', handler)
    return () => window.removeEventListener('drivefusion:open-upload', handler)
  }, [])

  const handleFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(file => uploadFile(file))
    setIsOpen(true)
  }, [uploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleModalDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsModalHover(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
      setShowUploadModal(false)
    }
  }, [handleFiles])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      setShowUploadModal(false)
      e.target.value = ''
    }
  }, [handleFiles])

  const activeUploads = queue.filter(i => i.status === 'uploading' || i.status === 'processing')
  const completedUploads = queue.filter(i => i.status === 'done')
  const failedUploads = queue.filter(i => i.status === 'error')

  return (
    <>
      {/* Hidden file input */}
      <input
        id="global-file-input"
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-on-background/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
          <div
            onDragOver={(e) => { e.preventDefault(); setIsModalHover(true) }}
            onDragLeave={() => setIsModalHover(false)}
            onDrop={handleModalDrop}
            className={`relative w-full max-w-md bg-surface-container-lowest rounded-[24px] premium-shadow border transition-all ${
              isModalHover ? 'border-primary border-2 bg-primary/[0.03]' : 'border-white/40'
            } overflow-hidden`}
          >
            <div className="p-8 sm:p-10 text-center">
              {/* Close */}
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-surface-container-low rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
              </button>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[40px] text-primary">cloud_upload</span>
              </div>

              <h3 className="text-headline font-bold text-on-surface mb-2">Upload Files</h3>
              <p className="text-body-sm text-on-surface-variant mb-8">
                Drop files anywhere on this card or click to browse
              </p>

              {/* Drop zone */}
              <div className={`rounded-2xl border-2 border-dashed p-10 mb-6 transition-all ${
                isModalHover ? 'border-primary bg-primary/5' : 'border-outline-variant/40'
              }`}>
                <span className="material-symbols-outlined text-[48px] text-outline mb-4 block">file_upload</span>
                <p className="text-body-sm text-on-surface-variant mb-4">Drag & drop files here</p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-8 py-4 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-[16px] font-bold premium-shadow hover:opacity-90 transition-all"
                >
                  Select Files
                </button>
              </div>

              <button
                onClick={() => setShowUploadModal(false)}
                className="text-on-surface-variant font-semibold text-body-sm hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Sheet */}
      {isOpen && queue.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] z-[60] transition-all duration-300">
          <div className="bg-surface/85 backdrop-blur-xl rounded-2xl premium-shadow p-5 border border-outline-variant/20">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {activeUploads.length > 0 && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                <span className="text-body font-semibold text-on-surface">
                  {activeUploads.length > 0
                    ? `Uploading ${activeUploads.length} file${activeUploads.length > 1 ? 's' : ''}...`
                    : `${completedUploads.length} upload${completedUploads.length !== 1 ? 's' : ''} complete`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* File List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {queue.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                          {item.file.type?.includes('pdf') ? 'picture_as_pdf' :
                           item.file.type?.includes('image') ? 'image' :
                           item.file.type?.includes('zip') ? 'folder_zip' : 'description'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm text-on-surface truncate max-w-[200px]">{item.file.name}</p>
                        <span className="text-[10px] text-outline uppercase tracking-wider">
                          {item.status === 'done' ? 'Complete' :
                           item.status === 'error' ? 'Failed' :
                           `${item.progress}%`}
                        </span>
                      </div>
                    </div>
                    {item.status === 'pending' || item.status === 'uploading' ? (
                      <button onClick={() => removeFromQueue(item.id)} className="text-outline hover:text-on-surface shrink-0">
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                      </button>
                    ) : item.status === 'done' ? (
                      <span className="material-symbols-outlined text-[16px] text-green-600 shrink-0">check_circle</span>
                    ) : null}
                  </div>
                  {item.status !== 'done' && item.status !== 'error' && (
                    <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drag overlay (page-level drag) */}
      {isDragOver && !showUploadModal && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className="fixed inset-0 z-[200] bg-primary/5 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="bg-surface-container-lowest rounded-[24px] premium-shadow p-12 text-center">
            <span className="material-symbols-outlined text-[64px] text-primary">cloud_upload</span>
            <h3 className="text-headline font-bold text-on-surface mt-4">Drop files to upload</h3>
            <p className="text-body-sm text-on-surface-variant mt-2">Files will be uploaded to your connected drives</p>
          </div>
        </div>
      )}

      {/* Global drag handlers */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!showUploadModal) setIsDragOver(true) }}
        onDragLeave={(e) => {
          if (!showUploadModal && (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node))) {
            setIsDragOver(false)
          }
        }}
        onDrop={(e) => { if (!showUploadModal) handleDrop(e) }}
        className="fixed inset-0 pointer-events-none z-0"
      />
    </>
  )
}
