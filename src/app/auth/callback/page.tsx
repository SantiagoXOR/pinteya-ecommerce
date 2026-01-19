/**
 * Página de callback después del login
 * Verifica el rol del usuario y redirige según corresponda
 * 
 * Usa Client Component para evitar errores de hidratación (React #310)
 * cuando la sesión no está lista inmediatamente después del OAuth callback
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from '@/lib/optimized-imports'

export default function AuthCallbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Esperar a que la sesión esté lista
    if (status === 'loading') {
      return
    }

    // Si no hay sesión después de cargar, redirigir al login
    if (status === 'unauthenticated') {
      console.log('[AuthCallback] No session found, redirecting to signin')
      router.replace('/auth/signin')
      return
    }

    // Si hay sesión, proceder con la redirección basada en rol
    if (status === 'authenticated' && session?.user && !isRedirecting) {
      setIsRedirecting(true)
      console.log('[AuthCallback] Session found, user role:', session.user.role)
      
      // Pequeño delay para asegurar que la sesión esté completamente sincronizada
      setTimeout(() => {
        if (session.user.role === 'admin') {
          console.log('[AuthCallback] Redirecting to admin panel')
          router.replace('/admin')
        } else {
          console.log('[AuthCallback] Redirecting to home')
          router.replace('/')
        }
      }, 100)
    }
  }, [session, status, router, isRedirecting])

  // Mostrar loading mientras se procesa
  return (
    <div className='min-h-screen bg-gradient-to-br from-blaze-orange-50 to-blaze-orange-100 flex items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='h-12 w-12 animate-spin text-blaze-orange-600 mx-auto mb-4' />
        <p className='text-gray-600 font-medium'>
          {status === 'loading' ? 'Verificando sesión...' : 'Redirigiendo...'}
        </p>
        <p className='text-gray-500 text-sm mt-2'>
          Por favor espera un momento
        </p>
      </div>
    </div>
  )
}



