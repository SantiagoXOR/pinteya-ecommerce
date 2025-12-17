'use client'

import { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { cn } from '@/lib/core/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export function AdminLayout({
  children,
  title,
  breadcrumbs,
  actions,
  className,
}: AdminLayoutProps) {
  // Estado para móvil (abierto/cerrado)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Toggle para móvil
  const handleMobileToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div data-admin-layout className='flex h-screen bg-gray-50 overflow-hidden'>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className='flex-1 flex flex-col min-w-0 h-screen m-0 p-0'>
        {/* Header */}
        <AdminHeader
          breadcrumbs={breadcrumbs}
          actions={actions}
          onMenuToggle={handleMobileToggle}
          isSidebarOpen={sidebarOpen}
        />

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto py-4 bg-gray-50/80 w-full',
            'scroll-smooth [scroll-padding-top:3.5rem]',
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
