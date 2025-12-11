'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/core/utils'
import { useState } from 'react'
// Importación desde optimized-imports (migrado a Tabler Icons)
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Home,
  Database,
  CreditCard,
  Search,
  Bell,
  Activity,
  ChevronLeft,
  ChevronRight,
} from '@/lib/optimized-imports'

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  disabled?: boolean
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Home,
  },
  {
    title: 'Productos',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Órdenes',
    href: '/admin/orders',
    icon: ShoppingCart,
    badge: 'Enterprise',
  },
  {
    title: 'Clientes',
    href: '/admin/customers',
    icon: Users,
    badge: 'Beta',
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'SEO Dashboard',
    href: '/admin/seo',
    icon: Search,
    badge: 'Enterprise',
  },
  {
    title: 'Monitoreo',
    href: '/admin/monitoring',
    icon: Activity,
    badge: 'Enterprise',
  },
  {
    title: 'MercadoPago',
    href: '/admin/mercadopago',
    icon: CreditCard,
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
    badge: 'Beta',
  },
  {
    title: 'Diagnósticos',
    href: '/admin/diagnostics',
    icon: Database,
  },
]

interface AdminSidebarProps {
  className?: string
  collapsed?: boolean
  onToggle?: () => void
}

export function AdminSidebar({ className, collapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <div
      data-testid='admin-sidebar'
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 h-full transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo/Brand */}
      <div className={cn('flex items-center h-16 border-b border-gray-200', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        {!collapsed && (
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-blaze-orange-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>P</span>
            </div>
            <span className='text-lg font-semibold text-gray-900'>Admin Panel</span>
          </div>
        )}
        {collapsed && (
          <div className='w-8 h-8 bg-blaze-orange-600 rounded-lg flex items-center justify-center'>
            <span className='text-white font-bold text-sm'>P</span>
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className='p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:flex hidden'
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? (
              <ChevronRight className='w-4 h-4 text-gray-600' />
            ) : (
              <ChevronLeft className='w-4 h-4 text-gray-600' />
            )}
          </button>
        )}
      </div>

      {/* Search Bar - Ocultar cuando está colapsado */}
      {!collapsed && (
        <div className='p-4 border-b border-gray-200'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Buscar...'
              className='w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 py-4 space-y-1', collapsed ? 'px-2' : 'px-4')}>
        {sidebarItems.map(item => {
          if (!item || !item.icon) {
            return null
          }

          const isActive =
            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <div
              key={item.href}
              className='relative'
              onMouseEnter={() => collapsed && setHoveredItem(item.href)}
              onMouseLeave={() => collapsed && setHoveredItem(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg transition-colors',
                  collapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2',
                  isActive
                    ? 'bg-blaze-orange-50 text-blaze-orange-700 border border-blaze-orange-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={e => item.disabled && e.preventDefault()}
                title={collapsed ? item.title : undefined}
              >
                <div className={cn('flex items-center', collapsed ? 'justify-center' : 'space-x-3')}>
                  {item.icon && (
                    <item.icon
                      className={cn(
                        'flex-shrink-0',
                        collapsed ? 'w-5 h-5' : 'w-5 h-5',
                        isActive ? 'text-blaze-orange-600' : 'text-gray-500'
                      )}
                    />
                  )}
                  {!collapsed && <span className='text-sm font-medium'>{item.title}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className='px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full'>
                    {item.badge}
                  </span>
                )}
              </Link>

              {/* Tooltip cuando está colapsado */}
              {collapsed && hoveredItem === item.href && (
                <div className='absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none'>
                  {item.title}
                  {item.badge && (
                    <span className='ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded'>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className='p-4 border-t border-gray-200'>
          <div className='flex items-center space-x-3 text-sm text-gray-600'>
            <Bell className='w-4 h-4' />
            <span>Notificaciones</span>
          </div>
        </div>
      )}
      {collapsed && (
        <div className='p-4 border-t border-gray-200 flex justify-center'>
          <div
            className='relative'
            onMouseEnter={() => setHoveredItem('notifications')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Bell className='w-5 h-5 text-gray-600' title='Notificaciones' />
            {hoveredItem === 'notifications' && (
              <div className='absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none'>
                Notificaciones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
