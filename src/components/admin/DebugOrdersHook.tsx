// =====================================================
// COMPONENTE: DebugOrdersHook
// Descripción: Componente para debuggear el hook useOrdersEnterprise
// =====================================================

'use client'

import { useOrdersEnterprise } from '@/hooks/admin/useOrdersEnterprise'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from '@/lib/optimized-imports'

export function DebugOrdersHook() {
  const hookData = useOrdersEnterprise()

  const {
    // Datos
    orders,
    stats,

    // Estados de carga
    isLoading,
    isLoadingOrders,
    isLoadingStats,

    // Errores
    error,
    ordersError,
    statsError,

    // Acciones
    refetchOrders,
    refetchStats,

    // Métricas derivadas
    derivedMetrics,
  } = hookData

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5 text-yellow-500' />
            Debug: useOrdersEnterprise Hook
          </CardTitle>
          <CardDescription>Estado interno del hook para diagnóstico</CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Estados de carga */}
          <div>
            <h4 className='font-medium mb-2'>Estados de Carga</h4>
            <div className='flex gap-2 flex-wrap'>
              <Badge variant={isLoading ? 'default' : 'secondary'}>
                General: {isLoading ? 'Cargando' : 'Listo'}
              </Badge>
              <Badge variant={isLoadingOrders ? 'default' : 'secondary'}>
                Órdenes: {isLoadingOrders ? 'Cargando' : 'Listo'}
              </Badge>
              <Badge variant={isLoadingStats ? 'default' : 'secondary'}>
                Stats: {isLoadingStats ? 'Cargando' : 'Listo'}
              </Badge>
            </div>
          </div>

          {/* Errores */}
          <div>
            <h4 className='font-medium mb-2'>Errores</h4>
            <div className='space-y-2'>
              {error && (
                <div className='flex items-center gap-2 text-red-600'>
                  <XCircle className='w-4 h-4' />
                  <span className='text-sm'>Error general: {error.message}</span>
                </div>
              )}
              {ordersError && (
                <div className='flex items-center gap-2 text-red-600'>
                  <XCircle className='w-4 h-4' />
                  <span className='text-sm'>Error órdenes: {ordersError.message}</span>
                </div>
              )}
              {statsError && (
                <div className='flex items-center gap-2 text-red-600'>
                  <XCircle className='w-4 h-4' />
                  <span className='text-sm'>Error stats: {statsError.message}</span>
                </div>
              )}
              {!error && !ordersError && !statsError && (
                <div className='flex items-center gap-2 text-green-600'>
                  <CheckCircle className='w-4 h-4' />
                  <span className='text-sm'>Sin errores</span>
                </div>
              )}
            </div>
          </div>

          {/* Datos */}
          <div>
            <h4 className='font-medium mb-2'>Datos</h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='font-medium'>Órdenes:</span> {orders?.length || 0}
              </div>
              <div>
                <span className='font-medium'>Stats disponibles:</span> {stats ? 'Sí' : 'No'}
              </div>
            </div>
          </div>

          {/* Stats detalladas */}
          {stats && (
            <div>
              <h4 className='font-medium mb-2'>Estadísticas</h4>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div>
                  <span className='font-medium'>Total:</span> {stats.totalOrders}
                </div>
                <div>
                  <span className='font-medium'>Pendientes:</span> {stats.pendingOrders}
                </div>
                <div>
                  <span className='font-medium'>Completadas:</span> {stats.completedOrders}
                </div>
                <div>
                  <span className='font-medium'>Revenue:</span> $
                  {stats.totalRevenue?.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Métricas derivadas */}
          {derivedMetrics && (
            <div>
              <h4 className='font-medium mb-2'>Métricas Derivadas</h4>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-medium'>Tiene órdenes:</span>{' '}
                  {derivedMetrics.hasOrders ? 'Sí' : 'No'}
                </div>
                <div>
                  <span className='font-medium'>Puede crear:</span>{' '}
                  {derivedMetrics.canCreateOrder ? 'Sí' : 'No'}
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div>
            <h4 className='font-medium mb-2'>Acciones</h4>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetchOrders()}
                disabled={isLoadingOrders}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                Refetch Órdenes
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetchStats()}
                disabled={isLoadingStats}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
                Refetch Stats
              </Button>
            </div>
          </div>

          {/* Raw data para debugging */}
          <details className='text-xs'>
            <summary className='cursor-pointer text-blue-600 hover:text-blue-800 font-medium'>
              Ver datos raw del hook
            </summary>
            <pre className='mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96'>
              {JSON.stringify(
                {
                  orders: orders?.slice(0, 2), // Solo primeras 2 órdenes
                  stats,
                  derivedMetrics,
                  isLoading,
                  isLoadingOrders,
                  isLoadingStats,
                  error: error?.message,
                  ordersError: ordersError?.message,
                  statsError: statsError?.message,
                },
                null,
                2
              )}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
