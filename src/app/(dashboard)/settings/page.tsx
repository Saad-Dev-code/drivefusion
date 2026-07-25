'use client'

import { useState, useRef } from 'react'
import { useUser } from '@/hooks/useUser'
import { useThemeMode } from '@/theme/ThemeProvider'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const { user } = useUser()
  const { mode, toggleMode } = useThemeMode()
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB')
      return
    }

    setUploading(true)
    setUploadError('')

    const fileExt = file.name.split('.').pop()
    const filePath = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })

    if (error) {
      setUploadError(error.message === 'The resource was not found' ? 'Storage bucket "avatars" not found. Create it in your Supabase dashboard.' : error.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, avatar_url: avatarUrl },
    })
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-page-title font-bold text-on-surface">Settings</h2>
        <p className="text-on-surface-variant text-body-sm">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-surface-container-lowest p-8 rounded-[24px] premium-shadow">
          <h3 className="text-headline font-semibold text-on-surface mb-6">Profile</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar
                src={avatarUrl || user?.user_metadata?.avatar_url}
                name={name || user?.user_metadata?.full_name || user?.email || 'User'}
                size="lg"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
            </div>
            <div>
              <p className="text-body font-bold text-on-surface">
                {user?.user_metadata?.full_name || user?.email || 'User'}
              </p>
              <p className="text-body-sm text-on-surface-variant">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-label text-on-surface-variant uppercase tracking-widest mb-2 block">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-surface-container-low rounded-full focus:ring-2 focus:ring-primary/20 text-body font-medium placeholder:text-outline outline-none transition-all"
                placeholder="Your name"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            {uploading && (
              <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Uploading avatar...
              </div>
            )}

            {uploadError && (
              <p className="text-body-sm text-error">{uploadError}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-8 py-3 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-[16px] font-semibold premium-shadow hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-surface-container-lowest p-8 rounded-[24px] premium-shadow">
          <h3 className="text-headline font-semibold text-on-surface mb-6">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-semibold text-on-surface">Theme</p>
              <p className="text-body-sm text-on-surface-variant">Switch between light and dark mode</p>
            </div>
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-surface-container-low rounded-[16px] font-semibold hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mode === 'light' ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{mode === 'light' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
