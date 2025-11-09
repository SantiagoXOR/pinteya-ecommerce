'use client'

/**
 * Botón de Acceso Admin en el Header
 * Muestra un botón para acceder al panel admin si el usuario está logueado
 * Si no está logueado, redirige al signin
 */

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Shield, LogIn } from 'lucide-react'

export function AdminAccessButton() {
  const { data: session, status } = useSession()

  // Verificar si el usuario es admin
  const isAdmin = session?.user?.role === 'admin'

  // Si está cargando, no mostrar nada
  if (status === 'loading') {
    return null
  }

  // Si es admin, mostrar botón directo al panel
  if (isAdmin) {
    return (
      <Link
        href='/admin'
        className='
          hidden sm:flex items-center gap-2 
          px-4 py-2 rounded-lg
          bg-white/10 hover:bg-white/20
          text-white
          transition-all duration-200
          hover:scale-105
          border border-white/20
          backdrop-blur-sm
        '
        title='Panel Administrativo'
      >
        <Shield className='w-4 h-4' />
        <span className='font-medium text-sm'>Admin</span>
      </Link>
    )
  }

  // Si está logueado pero no es admin, no mostrar nada
  if (session) {
    return null
  }

  // Si no está logueado, mostrar botón de login
  return (
    <Link
      href='/api/auth/signin?callbackUrl=/admin'
      className='
        hidden sm:flex items-center gap-2 
        px-3 py-2 rounded-lg
        text-white/80 hover:text-white
        hover:bg-white/10
        transition-all duration-200
      '
      title='Acceso Administrador'
    >
      <LogIn className='w-4 h-4' />
      <span className='text-sm'>Admin</span>
    </Link>
  )
}

