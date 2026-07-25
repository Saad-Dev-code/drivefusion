'use client'

import type { ReactNode } from 'react'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Avatar } from '@/components/ui/avatar'
import Sidebar from '@/components/ui/Sidebar'
import Topbar from '@/components/ui/Topbar'
import UploadDialog from '@/components/upload/UploadDialog'

const mobileNavItems = [
  { href: '/storage', icon: 'cloud_queue', label: 'Storage' },
  { href: '/files', icon: 'folder_open', label: 'Files' },
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/search', icon: 'search', label: 'Search' },
]

const navPaths = ['/storage', '/files', '/dashboard', '/search', '/settings']

export default function SidebarWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useUser()
  const navRef = useRef<HTMLDivElement>(null)
  const [indicatorLeft, setIndicatorLeft] = useState<number | null>(null)

  const activeIndex = navPaths.findIndex(
    p => pathname === p || pathname.startsWith(p + '/')
  )

  useEffect(() => {
    if (activeIndex === -1 || !navRef.current) return
    const links = navRef.current.querySelectorAll<HTMLAnchorElement>('.mobile-nav-link')
    const link = links[activeIndex]
    if (!link) return
    const linkRect = link.getBoundingClientRect()
    const navRect = navRef.current.getBoundingClientRect()
    setIndicatorLeft(linkRect.left - navRect.left + linkRect.width / 2)
  }, [activeIndex])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Area */}
      <div className="lg:ml-[280px]">
        {/* Desktop Topbar */}
        <div className="px-page-margin pt-page-margin hidden lg:block">
          <Topbar />
        </div>

        {/* Mobile Topbar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-gutter h-16">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
              <h1 className="text-[22px] font-bold tracking-tight text-primary">Drive Fusion</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="lg:px-page-margin lg:pb-page-margin pt-20 lg:pt-0 px-gutter pb-32">
          <div className="max-w-container-max-width mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Gooey SVG filter */}
      <svg className="absolute w-0 h-0" xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="nav-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="relative w-full max-w-lg" style={{ height: '100px' }}>
          {/* Overflow wrapper — clips any gooey drip below the nav */}
          <div className="absolute inset-0 overflow-hidden rounded-t-xl" style={{ height: '100px' }}>
            {/* Gooey nav bar */}
            <nav
              ref={navRef}
              className="absolute bottom-0 left-0 right-0 h-20"
              style={{ filter: 'url(#nav-goo)' }}
            >
              {/* Solid background */}
              <div className="absolute inset-0 bg-surface rounded-t-xl" />

              {/* Sliding indicator circle */}
              {indicatorLeft !== null && activeIndex !== -1 && (
                <span
                  className="absolute w-14 h-14 rounded-full bg-surface shadow-lg shadow-primary/5"
                  style={{
                    top: '-18px',
                    left: `${indicatorLeft}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 0,
                    transition: 'left 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                />
              )}

              {/* Links */}
              <div className="absolute inset-0 flex items-center justify-around px-2 z-10">
                {mobileNavItems.map((item, i) => {
                  const isActive = i === activeIndex
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mobile-nav-link flex flex-col items-center justify-center w-[68px] transition-all duration-500 ${
                        isActive
                          ? 'text-primary -translate-y-2'
                          : 'text-on-surface-variant/70 hover:text-primary'
                      }`}
                      style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                    >
                      <span
                        className={`material-symbols-outlined transition-all duration-500 ${
                          isActive ? 'text-[28px]' : 'text-[22px]'
                        }`}
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {item.icon}
                      </span>
                      <span
                        className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${
                          isActive
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-1'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}

                {/* Profile tab */}
                {!loading && (
                  <Link
                    href="/settings"
                    className={`mobile-nav-link flex flex-col items-center justify-center w-[68px] transition-all duration-500 ${
                      activeIndex === 4
                        ? 'text-primary -translate-y-2'
                        : 'text-on-surface-variant/70 hover:text-primary'
                    }`}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                  >
                    <Avatar
                      src={user?.user_metadata?.avatar_url}
                      name={user?.user_metadata?.full_name || user?.email || 'User'}
                      className={`transition-all duration-500 ${
                        activeIndex === 4 ? 'w-7 h-7' : 'w-[22px] h-[22px]'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${
                        activeIndex === 4
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-1'
                      }`}
                    >
                      Profile
                    </span>
                  </Link>
                )}
              </div>
            </nav>
          </div>

          {/* Top edge separator line */}
          <div className="absolute top-5 left-4 right-4 h-px bg-white/10 rounded-full" />
        </div>
      </div>

      {/* FAB — opens upload modal */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('drivefusion:open-upload'))}
        className="lg:hidden fixed bottom-24 right-gutter w-14 h-14 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-2xl premium-shadow flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      <UploadDialog />
    </div>
  )
}
