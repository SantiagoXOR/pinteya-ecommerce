'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { User, Package, Settings, LogOut, ChevronDown, MapPin } from '@/lib/optimized-imports'
import Link from 'next/link'

/**
 * Componente de Avatar + Dropdown Simplificado para Usuario
 * Reemplaza el sistema complejo de dashboard con funcionalidad básica
 *
 * Funcionalidades:
 * - Avatar con imagen del usuario (NextAuth.js)
 * - Dropdown con información básica
 * - Links a órdenes y perfil
 * - Logout funcional
 * - Responsive design
 */
export function UserAvatarDropdown() {
  const { user, signOut, isSignedIn } = useAuth()

  // No mostrar nada si no está autenticado
  if (!isSignedIn || !user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  // Obtener inicial para fallback del avatar
  const getUserInitial = () => {
    if (user.name) {
      return user.name.charAt(0).toUpperCase()
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  // Obtener nombre para mostrar
  const getDisplayName = () => {
    if (user.name) {
      return user.name
    }
    if (user.email) {
      return user.email.split('@')[0]
    }
    return 'Usuario'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-white/50 transition-all duration-200'
        >
          {/* Solo Avatar del usuario - sin nombre ni icono */}
          <Avatar className='h-10 w-10'>
            <AvatarImage src={user.image || undefined} alt={user.name || 'Usuario'} />
            <AvatarFallback className='bg-white text-blaze-orange-700 text-sm font-medium'>
              {getUserInitial()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-64'>
        {/* Header con información del usuario */}
        <DropdownMenuLabel className='font-normal'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10'>
              <AvatarImage src={user.image || undefined} alt={user.name || 'Usuario'} />
              <AvatarFallback className='bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-lg font-medium'>
                {getUserInitial()}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-900 dark:text-gray-200 truncate'>{user.name || 'Usuario'}</p>
              <p className='text-xs text-gray-500 truncate'>{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Mis Órdenes */}
        <DropdownMenuItem asChild>
          <Link href='/mis-ordenes' className='flex items-center cursor-pointer'>
            <Package className='mr-2 h-4 w-4' />
            <span>Mis Órdenes</span>
          </Link>
        </DropdownMenuItem>

        {/* Mis Direcciones */}
        <DropdownMenuItem asChild>
          <Link href='/addresses' className='flex items-center cursor-pointer'>
            <MapPin className='mr-2 h-4 w-4' />
            <span>Mis Direcciones</span>
          </Link>
        </DropdownMenuItem>

        {/* Mi Perfil */}
        <DropdownMenuItem asChild>
          <Link href='/profile' className='flex items-center cursor-pointer'>
            <User className='mr-2 h-4 w-4' />
            <span>Mi Perfil</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Cerrar Sesión */}
        <DropdownMenuItem
          onClick={handleLogout}
          className='text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer'
        >
          <LogOut className='mr-2 h-4 w-4' />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Componente de botón de login para usuarios no autenticados
 * Mantiene el estilo consistente con el header
 */
export function LoginButton() {
  return (
    <Button
      variant='ghost'
      asChild
      className='relative bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 p-2'
    >
      <Link href='/api/auth/signin' className='flex items-center justify-center'>
        <svg className='w-5 h-5' viewBox='0 0 24 24'>
          <path
            fill='#4285F4'
            d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
          />
          <path
            fill='#34A853'
            d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
          />
          <path
            fill='#FBBC05'
            d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
          />
          <path
            fill='#EA4335'
            d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
          />
        </svg>
      </Link>
    </Button>
  )
}
