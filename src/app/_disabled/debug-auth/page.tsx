'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

interface DebugInfo {
  timestamp: string
  authentication: {
    isAuthenticated: boolean
    userId: string | null
    orgRole: string | null
    sessionClaims: any
  }
  user: any
  roleCheck: {
    hasAdminRole: boolean
    roleFromSessionClaims: any
    roleFromPublicMetadata: any
    roleFromPrivateMetadata: any
  }
  environment: {
    clerkPublishableKey: string
    clerkSecretKey: string
    nodeEnv: string
  }
}

export default function DebugAuthPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { isLoaded: authLoaded, userId, sessionId, getToken } = useAuth()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugInfo = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/user-status')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setDebugInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoaded && authLoaded) {
      fetchDebugInfo()
    }
  }, [userLoaded, authLoaded])

  if (!userLoaded || !authLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información de autenticación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Debug de Autenticación</h1>
            <button
              onClick={fetchDebugInfo}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Información del Cliente */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Información del Cliente (useUser/useAuth)</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Usuario ID:</strong> {userId || 'No autenticado'}</p>
                  <p><strong>Sesión ID:</strong> {sessionId || 'Sin sesión'}</p>
                  <p><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Nombre:</strong> {user?.firstName} {user?.lastName}</p>
                  <p><strong>Metadata Pública:</strong> {JSON.stringify(user?.publicMetadata || {})}</p>
                  <p><strong>Organizaciones:</strong> {user?.organizationMemberships?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Servidor */}
          {debugInfo && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">Información del Servidor</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
                  <p><strong>Autenticado:</strong> {debugInfo.authentication.isAuthenticated ? '✅ Sí' : '❌ No'}</p>
                  <p><strong>User ID:</strong> {debugInfo.authentication.userId || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Verificación de Roles</h2>
                <div className={`rounded-lg p-4 ${debugInfo.roleCheck.hasAdminRole ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${debugInfo.roleCheck.hasAdminRole ? 'text-green-800' : 'text-red-800'}`}>
                    {debugInfo.roleCheck.hasAdminRole ? '✅ Tiene rol de Admin' : '❌ NO tiene rol de Admin'}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Rol en Session Claims:</strong> {debugInfo.roleCheck.roleFromSessionClaims || 'N/A'}</p>
                    <p><strong>Rol en Public Metadata:</strong> {debugInfo.roleCheck.roleFromPublicMetadata || 'N/A'}</p>
                    <p><strong>Rol en Private Metadata:</strong> {debugInfo.roleCheck.roleFromPrivateMetadata || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Session Claims Completos</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugInfo.authentication.sessionClaims, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Usuario Completo</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugInfo.user, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-semibold mb-2">Instrucciones</h3>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. Verifica que estés autenticado correctamente</li>
              <li>2. Revisa si tienes el rol 'admin' en alguno de los campos de metadata</li>
              <li>3. Si no tienes el rol, necesitas configurarlo en el dashboard de Clerk</li>
              <li>4. Contacta al administrador del sistema si necesitas permisos</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
