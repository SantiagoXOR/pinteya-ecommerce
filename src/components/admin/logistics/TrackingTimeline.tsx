// =====================================================
// COMPONENTE: TRACKING TIMELINE ENTERPRISE
// Descripción: Timeline visual de tracking con estados tiempo real
// Basado en: Patrones Spree Commerce + shadcn/ui
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Navigation,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Building,
} from 'lucide-react'
import { TrackingEvent, Shipment, ShipmentStatus } from '@/types/logistics'
import { useTrackingTimeline, useRealTimeTracking } from '@/hooks/admin/useTrackingEvents'
import { cn } from '@/lib/core/utils'
import { formatDate, formatRelativeTime } from '@/lib/utils/consolidated-utils'

// =====================================================
// INTERFACES
// =====================================================

interface TrackingTimelineProps {
  shipmentId: number
  realTime?: boolean
  compact?: boolean
  showProgress?: boolean
  className?: string
}

interface TimelineStepProps {
  step: TimelineStep
  isLast: boolean
  compact?: boolean
}

interface TimelineStep {
  status: string
  label: string
  description: string
  hasEvent: boolean
  isCurrent: boolean
  isCompleted: boolean
  isPending: boolean
  event?: TrackingEvent
}

// =====================================================
// CONFIGURACIÓN DE ESTADOS
// =====================================================

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  picked_up: {
    icon: Package,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  in_transit: {
    icon: Truck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
  },
  out_for_delivery: {
    icon: Navigation,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
  },
  delivered: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  exception: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
  cancelled: {
    icon: AlertTriangle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  returned: {
    icon: Package,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function TrackingTimeline({
  shipmentId,
  realTime = false,
  compact = false,
  showProgress = true,
  className,
}: TrackingTimelineProps) {
  const { events, timelineStates, shipment, currentStatus, lastEvent, isLoading, error, progress } =
    useTrackingTimeline(shipmentId)

  const { isRealTimeEnabled, lastUpdate, enableRealTime, disableRealTime, forceRefresh } =
    useRealTimeTracking(shipmentId)

  // Auto-enable real time if prop is true
  useEffect(() => {
    if (realTime && !isRealTimeEnabled) {
      enableRealTime()
    }
  }, [realTime, isRealTimeEnabled, enableRealTime])

  if (isLoading) {
    return <TrackingTimelineSkeleton compact={compact} />
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='flex flex-col items-center gap-4'>
            <AlertTriangle className='w-8 h-8 text-red-500' />
            <div className='text-center'>
              <h3 className='font-semibold'>Error al cargar tracking</h3>
              <p className='text-sm text-muted-foreground'>{error.message}</p>
            </div>
            <Button onClick={forceRefresh} variant='outline' size='sm'>
              <RefreshCw className='w-4 h-4 mr-2' />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!shipment || !timelineStates) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className={cn('flex items-center gap-2', compact ? 'text-base' : 'text-lg')}>
              <MapPin className='w-5 h-5' />
              Tracking: {shipment.shipment_number}
            </CardTitle>
            <CardDescription className={compact ? 'text-xs' : undefined}>
              {shipment.carrier?.name || 'Sin courier asignado'}
              {shipment.tracking_number && ` • ${shipment.tracking_number}`}
            </CardDescription>
          </div>

          <div className='flex items-center gap-2'>
            {lastUpdate && (
              <span className='text-xs text-muted-foreground'>
                Actualizado {formatRelativeTime(lastUpdate.toISOString())}
              </span>
            )}

            <Button
              variant='outline'
              size='sm'
              onClick={isRealTimeEnabled ? disableRealTime : enableRealTime}
              className={cn(
                'flex items-center gap-1',
                isRealTimeEnabled && 'bg-green-50 border-green-200 text-green-700'
              )}
            >
              <Eye className='w-3 h-3' />
              {isRealTimeEnabled ? 'Tiempo Real' : 'Activar TR'}
            </Button>

            <Button variant='ghost' size='sm' onClick={forceRefresh}>
              <RefreshCw className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && progress && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Progreso del envío</span>
              <span>{progress.percentage.toFixed(0)}%</span>
            </div>
            <Progress value={progress.percentage} className='h-2' />
            <div className='text-xs text-muted-foreground'>
              {progress.completed} de {progress.total} etapas completadas
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={compact ? 'px-4 pb-4' : undefined}>
        <div className='space-y-6'>
          {/* Timeline principal */}
          <div className='space-y-4'>
            {timelineStates.map((step, index) => (
              <TimelineStep
                key={step.status}
                step={step}
                isLast={index === timelineStates.length - 1}
                compact={compact}
              />
            ))}
          </div>

          {/* Eventos detallados */}
          {!compact && events && events.length > 0 && (
            <>
              <Separator />
              <div className='space-y-3'>
                <h4 className='font-semibold text-sm'>Historial Detallado</h4>
                <ScrollArea className='h-48'>
                  <div className='space-y-3'>
                    {events.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Información del envío */}
          {!compact && (
            <>
              <Separator />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4 text-muted-foreground' />
                    <span className='font-medium'>Creado:</span>
                    <span>{formatDate(shipment.created_at)}</span>
                  </div>

                  {shipment.estimated_delivery_date && (
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-muted-foreground' />
                      <span className='font-medium'>Entrega estimada:</span>
                      <span>{formatDate(shipment.estimated_delivery_date)}</span>
                    </div>
                  )}
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Building className='w-4 h-4 text-muted-foreground' />
                    <span className='font-medium'>Destino:</span>
                    <span>
                      {shipment.recipient_city || 'N/A'}, {shipment.recipient_country || 'N/A'}
                    </span>
                  </div>

                  {shipment.package_weight_kg && (
                    <div className='flex items-center gap-2'>
                      <Package className='w-4 h-4 text-muted-foreground' />
                      <span className='font-medium'>Peso:</span>
                      <span>{shipment.package_weight_kg} kg</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// COMPONENTE TIMELINE STEP
// =====================================================

function TimelineStep({ step, isLast, compact }: TimelineStepProps) {
  const config = statusConfig[step.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className='flex items-start gap-3'>
      {/* Icono y línea */}
      <div className='flex flex-col items-center'>
        <div
          className={cn(
            'flex items-center justify-center rounded-full border-2',
            compact ? 'w-8 h-8' : 'w-10 h-10',
            step.isCompleted && 'bg-green-100 border-green-300',
            step.isCurrent && config.bgColor + ' ' + config.borderColor,
            step.isPending && 'bg-gray-50 border-gray-200'
          )}
        >
          <Icon
            className={cn(
              compact ? 'w-4 h-4' : 'w-5 h-5',
              step.isCompleted && 'text-green-600',
              step.isCurrent && config.color,
              step.isPending && 'text-gray-400'
            )}
          />
        </div>

        {!isLast && (
          <div
            className={cn(
              'w-0.5 mt-2',
              compact ? 'h-8' : 'h-12',
              step.isCompleted ? 'bg-green-300' : 'bg-gray-200'
            )}
          />
        )}
      </div>

      {/* Contenido */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 mb-1'>
          <h4
            className={cn(
              'font-medium',
              compact ? 'text-sm' : 'text-base',
              step.isCompleted && 'text-green-800',
              step.isCurrent && 'text-gray-900',
              step.isPending && 'text-gray-500'
            )}
          >
            {step.label}
          </h4>

          {step.isCurrent && (
            <Badge variant='secondary' className='text-xs'>
              Actual
            </Badge>
          )}

          {step.isCompleted && (
            <Badge variant='default' className='text-xs bg-green-100 text-green-800'>
              Completado
            </Badge>
          )}
        </div>

        <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
          {step.description}
        </p>

        {step.event && (
          <div className={cn('mt-2 space-y-1', compact ? 'text-xs' : 'text-sm')}>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Clock className='w-3 h-3' />
              <span>
                {formatDate(step.event.occurred_at)} a las {formatTime(step.event.occurred_at)}
              </span>
            </div>

            {step.event.location && (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <MapPin className='w-3 h-3' />
                <span>{step.event.location}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE EVENT CARD
// =====================================================

function EventCard({ event }: { event: TrackingEvent }) {
  const config = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className='flex items-start gap-3 p-3 rounded-lg border bg-card'>
      <div className={cn('flex items-center justify-center w-8 h-8 rounded-full', config.bgColor)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>

      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between mb-1'>
          <h5 className='font-medium text-sm'>{event.description}</h5>
          <time className='text-xs text-muted-foreground'>{formatTime(event.occurred_at)}</time>
        </div>

        {event.location && (
          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <MapPin className='w-3 h-3' />
            <span>{event.location}</span>
          </div>
        )}

        <div className='text-xs text-muted-foreground mt-1'>{formatDate(event.occurred_at)}</div>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE SKELETON
// =====================================================

function TrackingTimelineSkeleton({ compact }: { compact?: boolean }) {
  return (
    <Card>
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <div className='space-y-2'>
          <div className='h-6 w-48 bg-gray-200 rounded animate-pulse' />
          <div className='h-4 w-32 bg-gray-200 rounded animate-pulse' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-start gap-3'>
              <div
                className={cn(
                  'rounded-full bg-gray-200 animate-pulse',
                  compact ? 'w-8 h-8' : 'w-10 h-10'
                )}
              />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse' />
                <div className='h-3 w-48 bg-gray-200 rounded animate-pulse' />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
