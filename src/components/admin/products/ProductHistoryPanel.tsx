'use client'

import { useState } from 'react'
import { AdminCard } from '../ui/AdminCard'
import { useProductHistory } from '@/hooks/admin/useProductHistory'
import {
  History,
  User,
  Clock,
  Edit,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
} from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface ProductHistoryPanelProps {
  productId: string
  className?: string
}

export function ProductHistoryPanel({ productId, className }: ProductHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLocalChanges, setShowLocalChanges] = useState(true)

  const { history, isLoading, error, refetch } = useProductHistory({
    productId,
    enabled: !!productId,
  })

  const filteredHistory = showLocalChanges ? history : history.filter(entry => !entry.isLocal)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus className='w-4 h-4 text-green-600' />
      case 'UPDATE':
        return <Edit className='w-4 h-4 text-blue-600' />
      case 'DELETE':
      case 'SOFT_DELETE':
        return <Trash2 className='w-4 h-4 text-red-600' />
      default:
        return <History className='w-4 h-4 text-gray-600' />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-50 border-green-200'
      case 'UPDATE':
        return 'bg-blue-50 border-blue-200'
      case 'DELETE':
      case 'SOFT_DELETE':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (error) {
    return (
      <AdminCard className={cn('p-4', className)}>
        <div className='flex items-center gap-2 text-red-600'>
          <AlertCircle className='w-4 h-4' />
          <span className='text-sm'>Error al cargar historial</span>
        </div>
      </AdminCard>
    )
  }

  return (
    <AdminCard className={cn('', className)}>
      {/* Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <History className='w-5 h-5 text-gray-600' />
            <h3 className='font-medium text-gray-900'>Historial de Cambios</h3>
            {history.length > 0 && (
              <span className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                {filteredHistory.length}
              </span>
            )}
          </div>

          <div className='flex items-center gap-2'>
            {/* Toggle local changes */}
            <button
              onClick={() => setShowLocalChanges(!showLocalChanges)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                showLocalChanges ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              )}
              title={showLocalChanges ? 'Ocultar cambios locales' : 'Mostrar cambios locales'}
            >
              {showLocalChanges ? <Eye className='w-3 h-3' /> : <EyeOff className='w-3 h-3' />}
              Locales
            </button>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
              title='Actualizar historial'
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>

            {/* Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
            >
              {isExpanded ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className='p-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <RefreshCw className='w-6 h-6 animate-spin text-gray-400' />
              <span className='ml-2 text-gray-500'>Cargando historial...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <History className='w-8 h-8 mx-auto mb-2 text-gray-300' />
              <p>No hay cambios registrados</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredHistory.slice(0, 20).map(entry => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    getActionColor(entry.action),
                    entry.isLocal && 'border-dashed'
                  )}
                >
                  {/* Action Icon */}
                  <div className='flex-shrink-0 mt-0.5'>{getActionIcon(entry.action)}</div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <p className='text-sm font-medium text-gray-900'>{entry.description}</p>
                      {entry.isLocal && (
                        <span className='px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded'>
                          Local
                        </span>
                      )}
                    </div>

                    <div className='flex items-center gap-4 text-xs text-gray-500'>
                      <div className='flex items-center gap-1'>
                        <User className='w-3 h-3' />
                        <span>{entry.user_name || 'Usuario'}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        <span>{entry.timeAgo}</span>
                      </div>
                    </div>

                    {/* Field details for updates */}
                    {entry.action === 'UPDATE' && entry.field_name && (
                      <div className='mt-2 p-2 bg-white bg-opacity-50 rounded text-xs'>
                        <div className='font-medium text-gray-700 mb-1'>
                          Campo: {entry.field_name}
                        </div>
                        {entry.old_value !== undefined && entry.new_value !== undefined && (
                          <div className='space-y-1'>
                            <div className='text-red-600'>
                              <span className='font-medium'>Anterior:</span>{' '}
                              {String(entry.old_value)}
                            </div>
                            <div className='text-green-600'>
                              <span className='font-medium'>Nuevo:</span> {String(entry.new_value)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredHistory.length > 20 && (
                <div className='text-center py-2'>
                  <button className='text-sm text-blaze-orange-600 hover:text-blaze-orange-700'>
                    Ver más cambios...
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed preview */}
      {!isExpanded && filteredHistory.length > 0 && (
        <div className='p-4'>
          <div className='flex items-center gap-3 text-sm text-gray-600'>
            <div className='flex -space-x-1'>
              {filteredHistory.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 border-white flex items-center justify-center',
                    getActionColor(entry.action)
                  )}
                  style={{ zIndex: 3 - index }}
                >
                  {getActionIcon(entry.action)}
                </div>
              ))}
            </div>
            <span>Último cambio: {filteredHistory[0]?.timeAgo}</span>
          </div>
        </div>
      )}
    </AdminCard>
  )
}
