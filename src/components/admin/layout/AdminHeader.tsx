'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  onMenuToggle?: () => void
  isSidebarOpen?: boolean
}

export function AdminHeader({
  breadcrumbs,
  actions,
  onMenuToggle,
  isSidebarOpen = true,
}: AdminHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full flex-shrink-0 border-b border-gray-200/70',
        'bg-white/90 backdrop-blur-md shadow-sm px-3 lg:px-5 py-2 rounded-none'
      )}
    >
      {/* Top Row */}
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          <button
            data-testid='back-button'
            onClick={handleBack}
            className='p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0'
            title='Volver atrás'
          >
            <ArrowLeft className='w-5 h-5 text-gray-600' />
          </button>

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
        </div>
      </div>

      {/* Actions Row */}
      {actions && (
        <div className='flex w-full flex-wrap items-center gap-2 sm:gap-3 mt-2'>{actions}</div>
      )}
    </header>
  )
}
