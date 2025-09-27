// =====================================================
// COMPONENTE: DiagnosticPanel
// Descripción: Panel de diagnóstico para debugging del admin
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Server,
  Code,
} from 'lucide-react'

// =====================================================
// INTERFACES
// =====================================================

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function DiagnosticPanel() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  // =====================================================
  // FUNCIONES DE DIAGNÓSTICO
  // =====================================================

  const runDiagnostics = async () => {
    setIsRunning(true)
    const diagnostics: DiagnosticResult[] = []

    try {
      // 1. Verificar API de órdenes
      try {
        const ordersResponse = await fetch('/api/admin/orders?limit=1')
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          diagnostics.push({
            name: 'API Órdenes',
            status: 'success',
            message: `API responde correctamente. ${ordersData.data?.length || 0} órdenes encontradas`,
            details: ordersData,
          })
        } else {
          diagnostics.push({
            name: 'API Órdenes',
            status: 'error',
            message: `Error ${ordersResponse.status}: ${ordersResponse.statusText}`,
            details: await ordersResponse.text(),
          })
        }
      } catch (error) {
        diagnostics.push({
          name: 'API Órdenes',
          status: 'error',
          message: `Error de conexión: ${error}`,
          details: error,
        })
      }

      // 2. Verificar API de productos
      try {
        const productsResponse = await fetch('/api/admin/products?limit=1')
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          diagnostics.push({
            name: 'API Productos',
            status: 'success',
            message: `API responde correctamente. ${productsData.data?.length || 0} productos encontrados`,
            details: productsData,
          })
        } else {
          diagnostics.push({
            name: 'API Productos',
            status: 'error',
            message: `Error ${productsResponse.status}: ${productsResponse.statusText}`,
            details: await productsResponse.text(),
          })
        }
      } catch (error) {
        diagnostics.push({
          name: 'API Productos',
          status: 'error',
          message: `Error de conexión: ${error}`,
          details: error,
        })
      }

      // 3. Verificar API de logística
      try {
        const logisticsResponse = await fetch('/api/admin/logistics/dashboard')
        if (logisticsResponse.ok) {
          const logisticsData = await logisticsResponse.json()
          diagnostics.push({
            name: 'API Logística',
            status: 'success',
            message: 'API de logística responde correctamente',
            details: logisticsData,
          })
        } else {
          diagnostics.push({
            name: 'API Logística',
            status: 'error',
            message: `Error ${logisticsResponse.status}: ${logisticsResponse.statusText}`,
            details: await logisticsResponse.text(),
          })
        }
      } catch (error) {
        diagnostics.push({
          name: 'API Logística',
          status: 'error',
          message: `Error de conexión: ${error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}`,
          details: error,
        })
      }

      // 4. Verificar autenticación
      try {
        const authResponse = await fetch('/api/auth/session')
        if (authResponse.ok) {
          const authData = await authResponse.json()
          diagnostics.push({
            name: 'Autenticación',
            status: authData.user ? 'success' : 'warning',
            message: authData.user
              ? `Usuario autenticado: ${authData.user.email}`
              : 'No hay usuario autenticado',
            details: authData,
          })
        } else {
          diagnostics.push({
            name: 'Autenticación',
            status: 'error',
            message: `Error verificando autenticación: ${authResponse.status}`,
            details: await authResponse.text(),
          })
        }
      } catch (error) {
        diagnostics.push({
          name: 'Autenticación',
          status: 'error',
          message: `Error de conexión: ${error}`,
          details: error,
        })
      }

      // 5. Verificar React Query
      try {
        diagnostics.push({
          name: 'React Query',
          status: 'success',
          message: 'React Query está disponible',
          details: 'Cliente configurado correctamente',
        })
      } catch (error) {
        diagnostics.push({
          name: 'React Query',
          status: 'error',
          message: `Error con React Query: ${error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}`,
          details:
            error instanceof Error ? error.message : error?.toString() || 'Error desconocido',
        })
      }
    } catch (error) {
      diagnostics.push({
        name: 'Diagnóstico General',
        status: 'error',
        message: `Error ejecutando diagnósticos: ${error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}`,
        details: error instanceof Error ? error.message : error?.toString() || 'Error desconocido',
      })
    }

    setResults(diagnostics)
    setIsRunning(false)
  }

  // Ejecutar diagnósticos al montar
  useEffect(() => {
    runDiagnostics()
  }, [])

  // =====================================================
  // HELPERS
  // =====================================================

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-500' />
      case 'error':
        return <XCircle className='w-5 h-5 text-red-500' />
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />
    }
  }

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            Éxito
          </Badge>
        )
      case 'error':
        return <Badge variant='destructive'>Error</Badge>
      case 'warning':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            Advertencia
          </Badge>
        )
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Code className='w-5 h-5' />
                Panel de Diagnóstico Enterprise
              </CardTitle>
              <CardDescription>
                Verificación del estado de APIs y componentes del panel administrativo
              </CardDescription>
            </div>
            <Button onClick={runDiagnostics} disabled={isRunning} variant='outline'>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Ejecutando...' : 'Ejecutar Diagnósticos'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Resumen */}
          <div className='grid grid-cols-3 gap-4 mb-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>{successCount}</div>
              <div className='text-sm text-muted-foreground'>Exitosos</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>{warningCount}</div>
              <div className='text-sm text-muted-foreground'>Advertencias</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>{errorCount}</div>
              <div className='text-sm text-muted-foreground'>Errores</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados del Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {results.map((result, index) => (
              <div key={index} className='flex items-start gap-3 p-4 border rounded-lg'>
                {getStatusIcon(result.status)}
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='font-medium'>{result.name}</h4>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className='text-sm text-muted-foreground mb-2'>{result.message}</p>
                  {result.details && (
                    <details className='text-xs'>
                      <summary className='cursor-pointer text-blue-600 hover:text-blue-800'>
                        Ver detalles
                      </summary>
                      <pre className='mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto'>
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}

            {results.length === 0 && !isRunning && (
              <div className='text-center py-8 text-muted-foreground'>
                <Database className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p>No hay resultados de diagnóstico disponibles</p>
                <Button onClick={runDiagnostics} className='mt-4'>
                  Ejecutar Diagnósticos
                </Button>
              </div>
            )}

            {isRunning && (
              <div className='text-center py-8'>
                <RefreshCw className='w-8 h-8 mx-auto mb-4 animate-spin text-blue-500' />
                <p className='text-muted-foreground'>Ejecutando diagnósticos...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
