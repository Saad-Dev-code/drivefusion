'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/files', icon: 'folder_open', label: 'My Files' },
  { href: '/recent', icon: 'schedule', label: 'Recent' },
]

const systemItems = [
  { href: '/storage', icon: 'cloud_done', label: 'Storage' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface/85 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 z-50">
      {/* Brand */}
      <div className="mb-10 flex items-center gap-3 px-4">
        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
        </div>
        <div>
          <h1 className="font-headline text-headline font-bold text-primary">Drive Fusion</h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Premium Storage</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all ${
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-secondary-container text-on-secondary-container font-bold'
                : 'text-on-surface-variant hover:bg-surface-variant/50'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-body text-[15px]">{item.label}</span>
          </Link>
        ))}

        <div className="my-3 border-t border-outline-variant/30" />

        {systemItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all ${
              pathname === item.href
                ? 'bg-secondary-container text-on-secondary-container font-bold'
                : 'text-on-surface-variant hover:bg-surface-variant/50'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-body text-[15px]">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Add Account Button */}
      <Link
        href="/accounts"
        className="w-full bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform premium-shadow"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        <span>Add Account</span>
      </Link>
    </aside>
  )
}
