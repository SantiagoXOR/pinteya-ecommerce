'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface DiagnosticResult {
  success: boolean
  message: string
  data?: any
  error?: string
  details?: string
}

export default function AdminDebugProductsPage() {
  const { user, isLoaded } = useUser()
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null)
  const [apiTest, setApiTest] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Test API de diagnóstico
  const testDiagnosticAPI = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/debug')
      const data = await response.json()
      setDiagnostics(data)
    } catch (error) {
      setDiagnostics({
        success: false,
        error: 'Error conectando con API de diagnóstico',
        details: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setLoading(false)
    }
  }

  // Test API de productos (la que está fallando)
  const testProductsAPI = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/products-test?page=1&limit=5')

      if (!response.ok) {
        const errorText = await response.text()
        setApiTest({
          success: false,
          message: `Error ${response.status}: ${response.statusText}`,
          error: errorText,
          details: `URL: ${response.url}`,
        })
        return
      }

      const data = await response.json()
      setApiTest({
        success: true,
        message: 'API de productos funcionando correctamente',
        data: {
          productsCount: data.data?.products?.length || 0,
          total: data.data?.total || 0,
          page: data.data?.pagination?.page || 0,
          hasData: !!data.data,
        },
      })
    } catch (error) {
      setApiTest({
        success: false,
        error: 'Error conectando con API de productos',
        details: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      testDiagnosticAPI()
    }
  }, [isLoaded])

  if (!isLoaded) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>
            🔍 Diagnóstico del Panel Administrativo
          </h1>

          {/* User Info */}
          <div className='mb-8 p-4 bg-blue-50 rounded-lg'>
            <h2 className='text-lg font-semibold text-blue-900 mb-2'>👤 Información del Usuario</h2>
            {user ? (
              <div className='space-y-2 text-sm'>
                <p>
                  <strong>ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
                </p>
                <p>
                  <strong>Rol (public):</strong>{' '}
                  {(user.publicMetadata?.role as string) || 'No definido'}
                </p>
                <p>
                  <strong>Rol (private):</strong>{' '}
                  {(user.privateMetadata?.role as string) || 'No definido'}
                </p>
                <p>
                  <strong>Autenticado:</strong> ✅ Sí
                </p>
              </div>
            ) : (
              <p className='text-red-600'>❌ Usuario no autenticado</p>
            )}
          </div>

          {/* Diagnostic Results */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>🔧 Diagnóstico del Sistema</h2>
              <button
                onClick={testDiagnosticAPI}
                disabled={loading}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
              >
                {loading ? 'Probando...' : 'Probar Diagnóstico'}
              </button>
            </div>

            {diagnostics && (
              <div
                className={`p-4 rounded-lg ${diagnostics.success ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <div className='flex items-center mb-2'>
                  <span
                    className={`text-lg mr-2 ${diagnostics.success ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {diagnostics.success ? '✅' : '❌'}
                  </span>
                  <span
                    className={`font-medium ${diagnostics.success ? 'text-green-800' : 'text-red-800'}`}
                  >
                    {diagnostics.message}
                  </span>
                </div>

                {diagnostics.data && (
                  <div className='mt-4 text-sm'>
                    <h3 className='font-medium mb-2'>Detalles:</h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <h4 className='font-medium text-gray-700'>Variables de Entorno:</h4>
                        <ul className='mt-1 space-y-1'>
                          <li>
                            Supabase URL:{' '}
                            {diagnostics.data.environment?.hasSupabaseUrl ? '✅' : '❌'}
                          </li>
                          <li>
                            Supabase Service Key:{' '}
                            {diagnostics.data.environment?.hasSupabaseServiceKey ? '✅' : '❌'}
                          </li>
                          <li>
                            Clerk Secret:{' '}
                            {diagnostics.data.environment?.hasClerkSecretKey ? '✅' : '❌'}
                          </li>
                          <li>
                            Clerk Publishable:{' '}
                            {diagnostics.data.environment?.hasClerkPublishableKey ? '✅' : '❌'}
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-700'>Base de Datos:</h4>
                        <ul className='mt-1 space-y-1'>
                          <li>
                            Conexión: {diagnostics.data.supabase?.connection === 'ok' ? '✅' : '❌'}
                          </li>
                          <li>
                            Tabla products:{' '}
                            {diagnostics.data.supabase?.productsTable === 'ok' ? '✅' : '❌'}
                          </li>
                          <li>
                            Tabla categories:{' '}
                            {diagnostics.data.supabase?.categoriesTable === 'ok' ? '✅' : '❌'}
                          </li>
                        </ul>
                      </div>
                    </div>

                    {diagnostics.data.recommendations && (
                      <div className='mt-4'>
                        <h4 className='font-medium text-gray-700'>Recomendaciones:</h4>
                        <ul className='mt-1 space-y-1'>
                          {diagnostics.data.recommendations.map((rec: string, index: number) => (
                            <li key={index} className='text-sm'>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {diagnostics.error && (
                  <div className='mt-2 text-sm text-red-600'>
                    <strong>Error:</strong> {diagnostics.error}
                    {diagnostics.details && (
                      <div className='mt-1'>
                        <strong>Detalles:</strong> {diagnostics.details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* API Test */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>🧪 Prueba de API de Productos</h2>
              <button
                onClick={testProductsAPI}
                disabled={loading}
                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50'
              >
                {loading ? 'Probando...' : 'Probar API Productos'}
              </button>
            </div>

            {apiTest && (
              <div className={`p-4 rounded-lg ${apiTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className='flex items-center mb-2'>
                  <span
                    className={`text-lg mr-2 ${apiTest.success ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {apiTest.success ? '✅' : '❌'}
                  </span>
                  <span
                    className={`font-medium ${apiTest.success ? 'text-green-800' : 'text-red-800'}`}
                  >
                    {apiTest.message}
                  </span>
                </div>

                {apiTest.data && (
                  <div className='mt-2 text-sm text-green-700'>
                    <p>Productos encontrados: {apiTest.data.productsCount}</p>
                    <p>Total en BD: {apiTest.data.total}</p>
                    <p>Página actual: {apiTest.data.page}</p>
                    <p>Datos válidos: {apiTest.data.hasData ? 'Sí' : 'No'}</p>
                  </div>
                )}

                {apiTest.error && (
                  <div className='mt-2 text-sm text-red-600'>
                    <strong>Error:</strong> {apiTest.error}
                    {apiTest.details && (
                      <div className='mt-1'>
                        <strong>Detalles:</strong> {apiTest.details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className='bg-yellow-50 p-4 rounded-lg'>
            <h3 className='font-medium text-yellow-800 mb-2'>📋 Instrucciones:</h3>
            <ol className='text-sm text-yellow-700 space-y-1'>
              <li>1. Verificar que el usuario esté autenticado y tenga rol admin</li>
              <li>2. Ejecutar diagnóstico del sistema para verificar configuración</li>
              <li>3. Probar API de productos para identificar errores específicos</li>
              <li>4. Si todo funciona aquí, el problema está en el componente useProductList</li>
              <li>5. Si falla aquí, el problema está en la autenticación/autorización</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
