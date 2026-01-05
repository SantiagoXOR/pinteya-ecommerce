// =====================================================
// COMPONENTE: LOGISTICS METRICS CARDS ENTERPRISE
// Descripción: Cards de métricas principales del dashboard
// Basado en: Patrones WooCommerce Activity Panels
// =====================================================

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
} from '@/lib/optimized-imports'
import { LogisticsStats } from '@/types/logistics'
import { cn } from '@/lib/core/utils'

// =====================================================
// INTERFACES
// =====================================================

interface LogisticsMetricsCardsProps {
  stats: LogisticsStats
  derivedMetrics?: {
    active_shipments_rate: number
    exception_rate: number
    average_shipping_cost: number
    shipments_trend: number
    best_performing_courier: any
  } | null
  className?: string
}

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  progress?: {
    value: number
    max: number
    label: string
  }
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  className?: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function LogisticsMetricsCards({
  stats,
  derivedMetrics,
  className,
}: LogisticsMetricsCardsProps) {
  // Calcular métricas adicionales
  const deliveryRate =
    stats.total_shipments > 0 ? (stats.delivered_shipments / stats.total_shipments) * 100 : 0

  const activeShipmentsCount = stats.pending_shipments + stats.in_transit_shipments

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {/* Total de Envíos */}
      <MetricCard
        title='Total Envíos'
        value={stats.total_shipments.toLocaleString()}
        description='Envíos totales registrados'
        icon={<Package className='w-6 h-6' />}
        trend={
          derivedMetrics
            ? {
                value: derivedMetrics.shipments_trend,
                isPositive: derivedMetrics.shipments_trend > 0,
                label: 'vs semana anterior',
              }
            : undefined
        }
        className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
      />

      {/* Envíos Activos */}
      <MetricCard
        title='Envíos Activos'
        value={activeShipmentsCount.toLocaleString()}
        description='En proceso y tránsito'
        icon={<Truck className='w-6 h-6 text-orange-600' />}
        progress={{
          value: activeShipmentsCount,
          max: stats.total_shipments || 1,
          label: `${derivedMetrics?.active_shipments_rate.toFixed(1) || 0}% del total`,
        }}
        badge={
          activeShipmentsCount > 0
            ? {
                text: 'Activos',
                variant: 'secondary',
              }
            : undefined
        }
        className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
      />

      {/* Tasa de Entrega */}
      <MetricCard
        title='Tasa de Entrega'
        value={`${deliveryRate.toFixed(1)}%`}
        description='Envíos entregados exitosamente'
        icon={<CheckCircle className='w-6 h-6 text-green-600' />}
        progress={{
          value: deliveryRate,
          max: 100,
          label: `${stats.delivered_shipments} de ${stats.total_shipments} entregados`,
        }}
        badge={{
          text: deliveryRate >= 90 ? 'Excelente' : deliveryRate >= 80 ? 'Bueno' : 'Mejorable',
          variant:
            deliveryRate >= 90 ? 'default' : deliveryRate >= 80 ? 'secondary' : 'destructive',
        }}
        className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'
      />

      {/* Tiempo Promedio de Entrega */}
      <MetricCard
        title='Tiempo Promedio'
        value={`${stats.average_delivery_time.toFixed(1)} días`}
        description='Tiempo promedio de entrega'
        icon={<Clock className='w-6 h-6 text-purple-600' />}
        badge={{
          text:
            stats.average_delivery_time <= 3
              ? 'Rápido'
              : stats.average_delivery_time <= 5
                ? 'Normal'
                : 'Lento',
          variant:
            stats.average_delivery_time <= 3
              ? 'default'
              : stats.average_delivery_time <= 5
                ? 'secondary'
                : 'destructive',
        }}
        className='bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
      />

      {/* Puntualidad */}
      <MetricCard
        title='Puntualidad'
        value={`${stats.on_time_delivery_rate.toFixed(1)}%`}
        description='Entregas a tiempo'
        icon={<TrendingUp className='w-6 h-6 text-emerald-600' />}
        progress={{
          value: stats.on_time_delivery_rate,
          max: 100,
          label: 'Objetivo: 95%',
        }}
        badge={{
          text:
            stats.on_time_delivery_rate >= 95
              ? 'Excelente'
              : stats.on_time_delivery_rate >= 85
                ? 'Bueno'
                : 'Crítico',
          variant:
            stats.on_time_delivery_rate >= 95
              ? 'default'
              : stats.on_time_delivery_rate >= 85
                ? 'secondary'
                : 'destructive',
        }}
        className='bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
      />

      {/* Excepciones */}
      <MetricCard
        title='Excepciones'
        value={stats.exception_shipments.toLocaleString()}
        description='Envíos con problemas'
        icon={<AlertTriangle className='w-6 h-6 text-red-600' />}
        progress={
          derivedMetrics
            ? {
                value: derivedMetrics.exception_rate,
                max: 100,
                label: `${derivedMetrics.exception_rate.toFixed(1)}% del total`,
              }
            : undefined
        }
        badge={
          stats.exception_shipments > 0
            ? {
                text: stats.exception_shipments > 5 ? 'Crítico' : 'Atención',
                variant: stats.exception_shipments > 5 ? 'destructive' : 'secondary',
              }
            : {
                text: 'Sin problemas',
                variant: 'default',
              }
        }
        className='bg-gradient-to-br from-red-50 to-red-100 border-red-200'
      />

      {/* Costo Total */}
      <MetricCard
        title='Costo Total'
        value={`$${stats.total_shipping_cost.toLocaleString()}`}
        description='Costo total de envíos'
        icon={<DollarSign className='w-6 h-6 text-yellow-600' />}
        trend={
          derivedMetrics
            ? {
                value: derivedMetrics.average_shipping_cost,
                isPositive: false, // Menor costo es mejor
                label: `Promedio: $${derivedMetrics.average_shipping_cost.toFixed(0)}`,
              }
            : undefined
        }
        className='bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
      />

      {/* Couriers Activos */}
      <MetricCard
        title='Couriers Activos'
        value={stats.active_couriers.toLocaleString()}
        description='Proveedores disponibles'
        icon={<Users className='w-6 h-6 text-indigo-600' />}
        badge={{
          text:
            stats.active_couriers >= 3
              ? 'Diversificado'
              : stats.active_couriers >= 2
                ? 'Básico'
                : 'Limitado',
          variant:
            stats.active_couriers >= 3
              ? 'default'
              : stats.active_couriers >= 2
                ? 'secondary'
                : 'destructive',
        }}
        className='bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
      />
    </div>
  )
}

// =====================================================
// COMPONENTE METRIC CARD
// =====================================================

function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  progress,
  badge,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {icon}
            <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
          </div>
          {badge && (
            <Badge variant={badge.variant} className='text-xs'>
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='space-y-3'>
          {/* Valor principal */}
          <div className='text-2xl font-bold'>{value}</div>

          {/* Descripción */}
          {description && <CardDescription className='text-xs'>{description}</CardDescription>}

          {/* Progress bar */}
          {progress && (
            <div className='space-y-1'>
              <Progress value={progress.value} max={progress.max} className='h-2' />
              <p className='text-xs text-muted-foreground'>{progress.label}</p>
            </div>
          )}

          {/* Trend */}
          {trend && (
            <div className='flex items-center space-x-1 text-xs'>
              {trend.isPositive ? (
                <TrendingUp className='w-3 h-3 text-green-500' />
              ) : (
                <TrendingDown className='w-3 h-3 text-red-500' />
              )}
              <span
                className={cn('font-medium', trend.isPositive ? 'text-green-600' : 'text-red-600')}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value.toFixed(1)}%
              </span>
              <span className='text-muted-foreground'>{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
