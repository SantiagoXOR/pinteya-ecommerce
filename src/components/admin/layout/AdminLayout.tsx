'use client'

import { useState, useEffect, useRef } from 'react'
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
  const mainRef = useRef<HTMLElement>(null)

  // Toggle para móvil
  const handleMobileToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // CRÍTICO: Aplicar estilos de scroll después de que el componente se monte
  // Esto sobrescribe los estilos inline del layout.tsx raíz
  useEffect(() => {
    if (mainRef.current) {
      // Aplicar estilos directamente al elemento usando setProperty con important
      mainRef.current.style.setProperty('overflow-y', 'auto', 'important')
      mainRef.current.style.setProperty('overflow-x', 'hidden', 'important')
      mainRef.current.style.setProperty('min-height', '0', 'important')
      mainRef.current.style.setProperty('max-height', '100%', 'important')
    }
  }, [])

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
      <div className='flex-1 flex flex-col min-w-0 min-h-0 h-screen m-0 p-0'>
        {/* Header */}
        <AdminHeader
          breadcrumbs={breadcrumbs}
          actions={actions}
          onMenuToggle={handleMobileToggle}
          isSidebarOpen={sidebarOpen}
        />

        {/* Page Content */}
        <main
          ref={mainRef}
          data-admin-main
          className={cn(
            'flex-1 min-h-0 overflow-y-auto py-4 bg-gray-50/80 w-full',
            'scroll-smooth [scroll-padding-top:3.5rem]',
            className
          )}
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            maxHeight: '100%',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
