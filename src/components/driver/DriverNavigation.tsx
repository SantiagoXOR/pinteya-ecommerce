/**
 * Componente de navegación mobile-first para drivers
 * Barra de navegación inferior optimizada para uso en vehículos
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Navigation, MapPin, Settings, User, Truck, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/core/utils'
import { useDriver } from '@/contexts/DriverContext'
import { Badge } from '@/components/ui/badge'

export function DriverNavigation() {
  const pathname = usePathname()
  const { state } = useDriver()

  // No mostrar navegación en la página de login
  if (pathname === '/driver/login') {
    return null
  }

  const navItems = [
    {
      href: '/driver/dashboard',
      icon: Home,
      label: 'Inicio',
      badge: state.assignedRoutes.length > 0 ? state.assignedRoutes.length : null,
    },
    {
      href: '/driver/routes',
      icon: Navigation,
      label: 'Rutas',
      badge: state.currentRoute ? 'Activa' : null,
    },
    {
      href: '/driver/deliveries',
      icon: CheckCircle,
      label: 'Entregas',
      badge: null,
    },
    {
      href: '/driver/profile',
      icon: User,
      label: 'Perfil',
      badge: null,
    },
  ]

  return (
    <>
      {/* Header superior */}
      <header className='bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='bg-blue-600 p-2 rounded-lg'>
              <Truck className='h-5 w-5 text-white' />
            </div>
            <div>
              <h1 className='font-semibold text-gray-900'>{state.driver?.name || 'Driver'}</h1>
              <div className='flex items-center space-x-2'>
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    state.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  )}
                />
                <span className='text-sm text-gray-600'>
                  {state.isOnline ? 'En línea' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>

          {/* Estado actual */}
          <div className='text-right'>
            {state.currentRoute && (
              <div className='flex items-center space-x-1'>
                <Clock className='h-4 w-4 text-blue-600' />
                <span className='text-sm font-medium text-blue-600'>Ruta Activa</span>
              </div>
            )}
            {state.isTracking && (
              <div className='flex items-center space-x-1 mt-1'>
                <MapPin className='h-3 w-3 text-green-600' />
                <span className='text-xs text-green-600'>GPS Activo</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navegación inferior */}
      <nav className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50'>
        <div className='grid grid-cols-4 h-16'>
          {navItems.map(item => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center space-y-1 relative',
                  'transition-colors duration-200',
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                )}
              >
                <div className='relative'>
                  <Icon className='h-5 w-5' />
                  {item.badge && (
                    <Badge
                      variant={typeof item.badge === 'string' ? 'default' : 'secondary'}
                      className='absolute -top-2 -right-2 h-4 min-w-4 text-xs px-1'
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className='text-xs font-medium'>{item.label}</span>

                {/* Indicador activo */}
                {isActive && (
                  <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full' />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
