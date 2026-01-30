'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
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
  Activity,
  Search,
  Bell,
  LogOut,
  MessageCircle,
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
  },
  {
    title: 'Base de Datos',
    href: '/admin/database',
    icon: Database,
  },
  {
    title: 'Diagnósticos',
    href: '/admin/diagnostics',
    icon: Search,
  },
  {
    title: 'AI Chat Debug',
    href: '/admin/ai-chat',
    icon: MessageCircle,
  },
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <div
      data-testid='admin-sidebar'
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 h-full w-16',
        className
      )}
    >
      {/* Navigation */}
      <nav className='flex-1 py-4 space-y-1 px-2'>
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
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  'flex items-center justify-center px-2 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blaze-orange-50 text-blaze-orange-700 border border-blaze-orange-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={e => item.disabled && e.preventDefault()}
                title={item.title}
              >
                    <item.icon
                      className={cn(
                    'flex-shrink-0 w-5 h-5',
                        isActive ? 'text-blaze-orange-600' : 'text-gray-500'
                      )}
                    />
              </Link>

              {/* Tooltip cuando se hace hover */}
              {hoveredItem === item.href && (
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

      {/* Footer con botones de notificación y usuario */}
      <div className='p-2 border-t border-gray-200 space-y-1'>
        {/* Botón de Notificaciones */}
        <div className='relative'>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className='w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors relative'
            onMouseEnter={() => setHoveredItem('notifications')}
            onMouseLeave={() => setHoveredItem(null)}
            title='Notificaciones'
          >
            <Bell className='w-5 h-5 text-gray-600' />
            <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full'></span>
          </button>

          {/* Tooltip */}
          {hoveredItem === 'notifications' && !notificationsOpen && (
              <div className='absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none'>
                Notificaciones
              </div>
            )}

          {/* Dropdown de notificaciones */}
          {notificationsOpen && (
            <>
              <div
                className='fixed inset-0 z-40'
                onClick={() => setNotificationsOpen(false)}
              />
              <div className='absolute left-full ml-2 bottom-0 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50'>
                <div className='p-4 border-b border-gray-200'>
                  <h3 className='text-sm font-medium text-gray-900'>Notificaciones</h3>
                </div>
                <div className='p-4 space-y-3 text-sm text-gray-700'>
                  <p>Sin notificaciones nuevas.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botón de Usuario */}
        <UserMenuButton
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
        />
      </div>
    </div>
  )
}

// Componente UserMenuButton para NextAuth.js
function UserMenuButton({
  hoveredItem,
  setHoveredItem,
}: {
  hoveredItem: string | null
  setHoveredItem: (item: string | null) => void
}) {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  // Debug: verificar estado de la sesión
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[UserMenuButton] Status:', status, 'Session:', session)
  }

  // Mostrar un placeholder mientras carga la sesión
  if (status === 'loading') {
    return (
      <div className='relative'>
        <div className='w-full flex items-center justify-center p-2 rounded-lg'>
          <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center animate-pulse'></div>
        </div>
      </div>
    )
  }

  // Si no hay sesión, mostrar un avatar por defecto
  if (!session?.user) {
    return (
      <div className='relative'>
        <button
          className='w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors'
          onMouseEnter={() => setHoveredItem('user')}
          onMouseLeave={() => setHoveredItem(null)}
          title='Usuario'
        >
          <div className='w-8 h-8 bg-blaze-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0'>
            U
          </div>
        </button>
        {hoveredItem === 'user' && (
          <div className='absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none'>
            Usuario
          </div>
        )}
      </div>
    )
  }

  const userInitial = (session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U').toUpperCase()

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors'
        onMouseEnter={() => setHoveredItem('user')}
        onMouseLeave={() => setHoveredItem(null)}
        title={session.user.name || session.user.email || 'Usuario'}
      >
        <div className='w-8 h-8 bg-blaze-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0'>
          {userInitial}
        </div>
      </button>

      {/* Tooltip */}
      {hoveredItem === 'user' && !isOpen && (
        <div className='absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none'>
          {session.user.name || session.user.email || 'Usuario'}
        </div>
      )}

      {/* Dropdown de usuario */}
      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
          />
          <div className='absolute left-full ml-2 bottom-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50'>
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
        </>
      )}
    </div>
  )
}
