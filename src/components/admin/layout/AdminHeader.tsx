'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, Menu, X, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/core/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminHeaderProps {
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  onMenuToggle?: () => void
  isSidebarOpen?: boolean
}

export function AdminHeader({
  title,
  breadcrumbs,
  actions,
  onMenuToggle,
  isSidebarOpen = true,
}: AdminHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full flex-shrink-0 border-b border-gray-200/70',
        'bg-white/90 backdrop-blur-md shadow-sm px-3 lg:px-5 py-3 space-y-3'
      )}
    >
      {/* Top Row */}
      <div className='flex items-start justify-between gap-3 flex-wrap'>
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          <button
            data-testid='mobile-menu-toggle'
            onClick={onMenuToggle}
            className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
          >
            {isSidebarOpen ? (
              <X className='w-5 h-5 text-gray-600' />
            ) : (
              <Menu className='w-5 h-5 text-gray-600' />
            )}
          </button>

          <div className='flex flex-col gap-1 min-w-0'>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                data-testid='breadcrumbs'
                className='flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500 truncate'
              >
                {breadcrumbs.map((item, index) => (
                  <div key={index} className='flex items-center gap-1'>
                    {index > 0 && <span className='text-gray-300'>/</span>}
                    {item.href ? (
                      <a
                        href={item.href}
                        className='text-gray-500 hover:text-gray-900 transition-colors truncate'
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span className='text-gray-900 font-medium truncate'>{item.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            )}

            {title && (
              <h1 className='text-base sm:text-xl font-semibold text-gray-900 truncate'>{title}</h1>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          <div className='relative'>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className='p-2 rounded-lg hover:bg-gray-100 transition-colors relative'
            >
              <Bell className='w-5 h-5 text-gray-600' />
              <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full'></span>
            </button>

            {notificationsOpen && (
              <div className='absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50'>
                <div className='p-4 border-b border-gray-200'>
                  <h3 className='text-sm font-medium text-gray-900'>Notificaciones</h3>
                </div>
                <div className='p-4 space-y-3 text-sm text-gray-700'>
                  <p>Sin notificaciones nuevas.</p>
                </div>
              </div>
            )}
          </div>

          <UserMenuButton />
        </div>
      </div>

      {/* Actions Row */}
      {actions && (
        <div className='flex w-full flex-wrap items-center gap-2 sm:gap-3'>{actions}</div>
      )}
    </header>
  )
}

// Componente UserMenuButton para NextAuth.js
function UserMenuButton() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) {
    return null
  }

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors'
      >
        <div className='w-8 h-8 bg-blaze-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium'>
          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
        </div>
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50'>
          <div className='px-4 py-2 border-b border-gray-200'>
            <p className='text-sm font-medium text-gray-900'>{session.user.name}</p>
            <p className='text-xs text-gray-500'>{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
          >
            <LogOut className='w-4 h-4' />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  )
}
