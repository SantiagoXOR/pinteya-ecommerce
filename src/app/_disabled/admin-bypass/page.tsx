'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminBypass() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      // Verificar si el usuario tiene rol de admin
      const hasAdminRole = user?.publicMetadata?.role === 'admin' || 
                          user?.privateMetadata?.role === 'admin'
      
      console.log('🔍 [ADMIN-BYPASS] Verificación:', {
        userId: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        publicMetadata: user?.publicMetadata,
        privateMetadata: user?.privateMetadata,
        hasAdminRole
      })

      if (!session?.user) {
        // Redirigir a login si no está autenticado
        router.push('/signin?redirect_url=/admin-bypass')
        return
      }

      if (hasAdminRole) {
        setIsAuthorized(true)
        // Redirigir al panel admin real después de 2 segundos
        setTimeout(() => {
          window.location.href = '/admin'
        }, 2000)
      } else {
        setIsAuthorized(false)
      }
      
      setLoading(false)
    }
  }, [isLoaded, user, router])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              No tienes permisos de administrador para acceder a esta sección.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Volver al Inicio
              </button>
              <div className="text-sm text-gray-500">
                <p>Usuario: {user?.emailAddresses?.[0]?.emailAddress}</p>
                <p>Rol actual: {user?.publicMetadata?.role || 'Sin rol asignado'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Acceso Autorizado!</h1>
          <p className="text-gray-600 mb-6">
            Tienes permisos de administrador. Redirigiendo al panel admin...
          </p>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-2 bg-orange-200 rounded-full">
                <div className="h-2 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/admin'}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Ir al Panel Admin Ahora
            </button>
            <div className="text-sm text-gray-500">
              <p>Bienvenido: {user?.firstName} {user?.lastName}</p>
              <p>Email: {user?.emailAddresses?.[0]?.emailAddress}</p>
              <p>Rol: {user?.publicMetadata?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
