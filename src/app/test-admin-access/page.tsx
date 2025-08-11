'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

interface DebugInfo {
  timestamp: string
  authentication: {
    isAuthenticated: boolean
    userId: string | null
    orgRole: string | null
    sessionClaims: any
  }
  user: {
    id: string | null
    email: string | null
    firstName: string | null
    lastName: string | null
    publicMetadata: any
    privateMetadata: any
    organizationMemberships: any[]
  } | null
  roleCheck: {
    hasAdminRole: boolean
    roleFromSessionClaims: string | null
    roleFromPublicMetadata: string | null
    roleFromPrivateMetadata: string | null
  }
  environment: {
    clerkPublishableKey: string
    clerkSecretKey: string
    nodeEnv: string
  }
}

export default function TestAdminAccess() {
  const { user, isLoaded } = useUser()
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

  const testAdminAccess = async () => {
    try {
      const response = await fetch('/admin')
      console.log('Test admin access response:', response.status, response.statusText)
      
      if (response.redirected) {
        console.log('Redirected to:', response.url)
      }
    } catch (err) {
      console.error('Error testing admin access:', err)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchDebugInfo()
    }
  }, [isLoaded])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información de usuario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Test de Acceso Admin</h1>
            <div className="space-x-4">
              <button
                onClick={fetchDebugInfo}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
              <button
                onClick={testAdminAccess}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
              >
                Probar Acceso Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Información del Cliente (useUser) */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Información del Cliente (useUser)</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Usuario ID:</strong> {user?.id || 'No disponible'}
                </div>
                <div>
                  <strong>Nombre:</strong> {user?.firstName} {user?.lastName}
                </div>
                <div>
                  <strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'No disponible'}
                </div>
                <div>
                  <strong>Metadata Pública:</strong> {JSON.stringify(user?.publicMetadata || {})}
                </div>
              </div>
            </div>
          </div>

          {/* Información del Servidor */}
          {debugInfo && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Información del Servidor (API)</h2>
              
              {/* Verificación de Roles */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Verificación de Roles</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>¿Tiene rol admin?:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      debugInfo.roleCheck.hasAdminRole 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {debugInfo.roleCheck.hasAdminRole ? 'SÍ' : 'NO'}
                    </span>
                  </div>
                  <div>
                    <strong>Rol en Session Claims:</strong> {debugInfo.roleCheck.roleFromSessionClaims || 'No encontrado'}
                  </div>
                  <div>
                    <strong>Rol en Public Metadata:</strong> {debugInfo.roleCheck.roleFromPublicMetadata || 'No encontrado'}
                  </div>
                  <div>
                    <strong>Rol en Private Metadata:</strong> {debugInfo.roleCheck.roleFromPrivateMetadata || 'No encontrado'}
                  </div>
                </div>
              </div>

              {/* Información de Autenticación */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Autenticación</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Autenticado:</strong> {debugInfo.authentication.isAuthenticated ? 'SÍ' : 'NO'}
                  </div>
                  <div>
                    <strong>User ID:</strong> {debugInfo.authentication.userId || 'No disponible'}
                  </div>
                </div>
              </div>

              {/* Información de Usuario Completa */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Usuario Completo</h3>
                <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-64">
                  {JSON.stringify(debugInfo.user, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-blue-800 font-semibold mb-2">Instrucciones</h3>
            <ol className="text-blue-700 space-y-1">
              <li>1. Verifica que estés autenticado correctamente</li>
              <li>2. Revisa si tienes el rol 'admin' en alguno de los campos de metadata</li>
              <li>3. Si no tienes el rol, necesitas configurarlo en el dashboard de Clerk</li>
              <li>4. Usa el botón "Probar Acceso Admin" para verificar el middleware</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
