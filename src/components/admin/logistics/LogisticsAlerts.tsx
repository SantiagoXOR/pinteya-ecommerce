// =====================================================
// COMPONENTE: LOGISTICS ALERTS ENTERPRISE
// Descripción: Sistema de alertas para el dashboard de logística
// Basado en: Patrones WooCommerce + shadcn/ui Alert
// =====================================================

'use client'

import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Eye,
  ExternalLink,
  Clock,
  Package,
  Truck,
  MapPin,
} from 'lucide-react'
import { LogisticsAlert } from '@/types/logistics'
import { cn } from '@/lib/core/utils'
import { formatDate, formatRelativeTime } from '@/lib/utils/consolidated-utils'
import Link from 'next/link'

// =====================================================
// INTERFACES
// =====================================================

interface LogisticsAlertsProps {
  alerts: LogisticsAlert[]
  maxVisible?: number
  showAll?: boolean
  onDismiss?: (alertId: string) => void
  onMarkAsRead?: (alertId: string) => void
  className?: string
}

interface AlertItemProps {
  alert: LogisticsAlert
  onDismiss?: (alertId: string) => void
  onMarkAsRead?: (alertId: string) => void
  compact?: boolean
}

// =====================================================
// CONFIGURACIÓN DE ALERTAS
// =====================================================

const alertConfig = {
  error: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    descriptionColor: 'text-red-700',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    descriptionColor: 'text-yellow-700',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    descriptionColor: 'text-blue-700',
  },
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function LogisticsAlerts({
  alerts,
  maxVisible = 5,
  showAll = false,
  onDismiss,
  onMarkAsRead,
  className,
}: LogisticsAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Filtrar alertas no descartadas
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id))

  // Limitar número de alertas visibles
  const displayedAlerts = showAll ? visibleAlerts : visibleAlerts.slice(0, maxVisible)

  const remainingCount = visibleAlerts.length - displayedAlerts.length

  // Categorizar alertas
  const criticalAlerts = visibleAlerts.filter(alert => alert.type === 'error')
  const warningAlerts = visibleAlerts.filter(alert => alert.type === 'warning')
  const infoAlerts = visibleAlerts.filter(alert => alert.type === 'info')

  // Handler para descartar alerta
  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
    onDismiss?.(alertId)
  }

  // Handler para marcar como leída
  const handleMarkAsRead = (alertId: string) => {
    onMarkAsRead?.(alertId)
  }

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Resumen de alertas */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <h3 className='text-lg font-semibold'>Alertas del Sistema</h3>
          <div className='flex items-center gap-2'>
            {criticalAlerts.length > 0 && (
              <Badge variant='destructive' className='flex items-center gap-1'>
                <AlertTriangle className='w-3 h-3' />
                {criticalAlerts.length} Críticas
              </Badge>
            )}
            {warningAlerts.length > 0 && (
              <Badge variant='secondary' className='flex items-center gap-1'>
                <AlertCircle className='w-3 h-3' />
                {warningAlerts.length} Advertencias
              </Badge>
            )}
            {infoAlerts.length > 0 && (
              <Badge variant='outline' className='flex items-center gap-1'>
                <Info className='w-3 h-3' />
                {infoAlerts.length} Informativas
              </Badge>
            )}
          </div>
        </div>

        {remainingCount > 0 && (
          <Button variant='outline' size='sm'>
            Ver todas ({remainingCount} más)
          </Button>
        )}
      </div>

      {/* Lista de alertas */}
      <div className='space-y-3'>
        {displayedAlerts.map(alert => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onDismiss={handleDismiss}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </div>

      {/* Alertas agrupadas por tipo */}
      {showAll && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
          {/* Alertas críticas */}
          {criticalAlerts.length > 0 && (
            <Card className='border-red-200'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm text-red-800 flex items-center gap-2'>
                  <AlertTriangle className='w-4 h-4' />
                  Críticas ({criticalAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className='h-32'>
                  <div className='space-y-2'>
                    {criticalAlerts.map(alert => (
                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        onDismiss={handleDismiss}
                        onMarkAsRead={handleMarkAsRead}
                        compact={true}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Alertas de advertencia */}
          {warningAlerts.length > 0 && (
            <Card className='border-yellow-200'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm text-yellow-800 flex items-center gap-2'>
                  <AlertCircle className='w-4 h-4' />
                  Advertencias ({warningAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className='h-32'>
                  <div className='space-y-2'>
                    {warningAlerts.map(alert => (
                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        onDismiss={handleDismiss}
                        onMarkAsRead={handleMarkAsRead}
                        compact={true}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Alertas informativas */}
          {infoAlerts.length > 0 && (
            <Card className='border-blue-200'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm text-blue-800 flex items-center gap-2'>
                  <Info className='w-4 h-4' />
                  Informativas ({infoAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className='h-32'>
                  <div className='space-y-2'>
                    {infoAlerts.map(alert => (
                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        onDismiss={handleDismiss}
                        onMarkAsRead={handleMarkAsRead}
                        compact={true}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE ALERT ITEM
// =====================================================

function AlertItem({ alert, onDismiss, onMarkAsRead, compact = false }: AlertItemProps) {
  const config = alertConfig[alert.type]
  const Icon = config.icon

  return (
    <Alert
      className={cn(
        config.bgColor,
        !alert.is_read && 'ring-2 ring-offset-2',
        alert.type === 'error' && !alert.is_read && 'ring-red-200',
        alert.type === 'warning' && !alert.is_read && 'ring-yellow-200',
        alert.type === 'info' && !alert.is_read && 'ring-blue-200',
        compact && 'p-3'
      )}
    >
      <div className='flex items-start justify-between'>
        <div className='flex items-start gap-3 flex-1'>
          <Icon className={cn('w-4 h-4 mt-0.5', config.iconColor)} />

          <div className='flex-1 space-y-1'>
            <AlertTitle
              className={cn('text-sm font-medium', config.titleColor, compact && 'text-xs')}
            >
              {alert.title}
              {!alert.is_read && (
                <Badge variant='outline' className='ml-2 text-xs'>
                  Nuevo
                </Badge>
              )}
            </AlertTitle>

            <AlertDescription
              className={cn('text-sm', config.descriptionColor, compact && 'text-xs')}
            >
              {alert.description}
            </AlertDescription>

            {!compact && (
              <div className='flex items-center gap-4 mt-2 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Clock className='w-3 h-3' />
                  {formatRelativeTime(alert.created_at)}
                </div>

                {alert.shipment_id && (
                  <div className='flex items-center gap-1'>
                    <Package className='w-3 h-3' />
                    Envío #{alert.shipment_id}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className='flex items-center gap-1 ml-2'>
          {!alert.is_read && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onMarkAsRead?.(alert.id)}
              className='h-6 w-6 p-0'
              title='Marcar como leída'
            >
              <Eye className='w-3 h-3' />
            </Button>
          )}

          {alert.action_url && (
            <Button variant='ghost' size='sm' asChild className='h-6 w-6 p-0' title='Ver detalles'>
              <Link href={alert.action_url}>
                <ExternalLink className='w-3 h-3' />
              </Link>
            </Button>
          )}

          <Button
            variant='ghost'
            size='sm'
            onClick={() => onDismiss?.(alert.id)}
            className='h-6 w-6 p-0'
            title='Descartar'
          >
            <X className='w-3 h-3' />
          </Button>
        </div>
      </div>
    </Alert>
  )
}

// =====================================================
// COMPONENTE ALERT SUMMARY
// =====================================================

export function LogisticsAlertsSummary({ alerts }: { alerts: LogisticsAlert[] }) {
  const unreadAlerts = alerts.filter(alert => !alert.is_read)
  const criticalCount = unreadAlerts.filter(alert => alert.type === 'error').length
  const warningCount = unreadAlerts.filter(alert => alert.type === 'warning').length

  if (unreadAlerts.length === 0) {
    return (
      <div className='flex items-center gap-2 text-sm text-green-600'>
        <CheckCircle className='w-4 h-4' />
        Sin alertas pendientes
      </div>
    )
  }

  return (
    <div className='flex items-center gap-3'>
      {criticalCount > 0 && (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <AlertTriangle className='w-3 h-3' />
          {criticalCount}
        </Badge>
      )}

      {warningCount > 0 && (
        <Badge variant='secondary' className='flex items-center gap-1'>
          <AlertCircle className='w-3 h-3' />
          {warningCount}
        </Badge>
      )}

      <span className='text-sm text-muted-foreground'>
        {unreadAlerts.length} alertas pendientes
      </span>
    </div>
  )
}
