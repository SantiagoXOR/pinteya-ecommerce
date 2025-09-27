'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/User/Sidebar'
import { DashboardHeader } from '@/components/User/DashboardHeader'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/api/auth/signin?callbackUrl=/dashboard')
    }
  }, [isSignedIn, isLoaded, router])

  // Mostrar loading mientras se verifica la autenticación
  if (!isLoaded) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary'></div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!isSignedIn) {
    return null
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header del Dashboard */}
      <DashboardHeader />

      <div className='flex'>
        {/* Sidebar */}
        <Sidebar />

        {/* Contenido Principal */}
        <main className='flex-1 lg:pl-64'>
          <div className='p-6'>{children}</div>
        </main>
      </div>
    </div>
  )
}
