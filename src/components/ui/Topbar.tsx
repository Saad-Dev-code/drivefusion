'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { useThemeMode } from '@/theme/ThemeProvider'
import { Avatar } from '@/components/ui/avatar'

interface TopbarProps {
  title?: string
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter()
  const { user, loading } = useUser()
  const { mode, toggleMode } = useThemeMode()
  const [query, setQuery] = useState('')

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }, [query, router])

  return (
    <header className="flex items-center justify-between gap-8 mb-8">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-[18px] bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/20 text-body font-medium placeholder:text-outline transition-all outline-none"
          placeholder="Search your cloud fusion..."
          type="text"
        />
      </form>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMode}
          className="p-3 rounded-full hover:bg-surface-variant/30 transition-all text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[22px]">
            {mode === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        <button
          onClick={() => router.push('/search')}
          className="p-3 rounded-full hover:bg-surface-variant/30 transition-all text-on-surface-variant relative"
        >
          <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
        </button>
        {!loading && (
          <button onClick={() => router.push('/settings')} className="outline-none">
            <Avatar
              src={user?.user_metadata?.avatar_url}
              name={user?.user_metadata?.full_name || user?.email || 'User'}
            />
          </button>
        )}
      </div>
    </header>
  )
}
