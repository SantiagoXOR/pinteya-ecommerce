'use client'

/**
 * Componente para mostrar resumen completo de analytics
 * Extrae información de eventos, journeys y carritos abandonados
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, TrendingUp, TrendingDown, ShoppingCart, Users, Eye, DollarSign } from '@/lib/optimized-imports'

interface AnalyticsSummaryData {
  tenant: {
    id: string
    name: string
    slug: string
  }
  period: {
    days: number
    startDate: string
    endDate: string
  }
  events: {
    totalEvents: number
    sessionCount: number
    visitorCount: number
    cartAdditions: number
    checkoutStarts: number
    purchases: number
    abandonmentRate: number
    conversionRate: number
  }
  journeys: {
    totalJourneys: number
    convertedJourneys: number
    abandonedJourneys: number
    conversionRate: number
    avgPagesPerJourney: number
    avgDuration: number
  }
  abandonedCarts: {
    totalAbandoned: number
    totalAbandonedValue: number
    averageCartValue: number
    abandonmentByPage: Array<{
      page: string
      count: number
      percentage: number
    }>
  }
  generatedAt: string
}

export const AnalyticsSummary: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics/summary?days=${days}`)
      if (!response.ok) {
        throw new Error('Error obteniendo resumen')
      }

      const data = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [days])

  if (loading && !summary) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando resumen de analytics...</p>
        </CardContent>
      </Card>
    )
  }

  if (error && !summary) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <p className="font-semibold mb-2">Error al cargar resumen</p>
            <p className="text-sm">{error}</p>
            <Button onClick={fetchSummary} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) return null

  return (
    <div className="space-y-6">
      {/* Header con filtro de días */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resumen de Analytics</CardTitle>
              <CardDescription>
                Datos extraídos directamente de la base de datos
                {summary.tenant && ` - ${summary.tenant.name}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Período:</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 7)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">días</span>
              </div>
              <Button variant="outline" onClick={fetchSummary} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumen de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Eventos</div>
              <div className="text-2xl font-bold">{summary.events.totalEvents.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Sesiones Únicas</div>
              <div className="text-2xl font-bold">{summary.events.sessionCount.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Visitantes Únicos</div>
              <div className="text-2xl font-bold">{summary.events.visitorCount.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Agregados al Carrito</div>
              <div className="text-2xl font-bold">{summary.events.cartAdditions.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Inicios de Checkout</div>
              <div className="text-2xl font-bold">{summary.events.checkoutStarts.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Compras Completadas</div>
              <div className="text-2xl font-bold text-green-600">
                {summary.events.purchases.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Tasa de Abandono</div>
              <div className="text-2xl font-bold text-red-600">
                {summary.events.abandonmentRate.toFixed(1)}%
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Tasa de Conversión</div>
              <div className="text-2xl font-bold text-green-600">
                {summary.events.conversionRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Journeys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Journeys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Journeys</div>
              <div className="text-2xl font-bold">{summary.journeys.totalJourneys.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-1">Journeys Convertidos</div>
              <div className="text-2xl font-bold text-green-600">
                {summary.journeys.convertedJourneys.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {summary.journeys.conversionRate.toFixed(1)}% de conversión
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-700 mb-1">Journeys Abandonados</div>
              <div className="text-2xl font-bold text-red-600">
                {summary.journeys.abandonedJourneys.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Páginas Promedio</div>
              <div className="text-2xl font-bold">{summary.journeys.avgPagesPerJourney}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Duración Promedio</div>
              <div className="text-2xl font-bold">{summary.journeys.avgDuration.toFixed(1)} min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Carritos Abandonados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carritos Abandonados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Abandonados</div>
              <div className="text-2xl font-bold text-red-600">
                {summary.abandonedCarts.totalAbandoned.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Valor Total Abandonado</div>
              <div className="text-2xl font-bold text-red-600">
                ${summary.abandonedCarts.totalAbandonedValue.toLocaleString('es-AR')}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Valor Promedio</div>
              <div className="text-2xl font-bold">
                ${Math.round(summary.abandonedCarts.averageCartValue).toLocaleString('es-AR')}
              </div>
            </div>
          </div>

          {/* Top páginas de abandono */}
          {summary.abandonedCarts.abandonmentByPage.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Top Páginas de Abandono</h4>
              <div className="space-y-2">
                {summary.abandonedCarts.abandonmentByPage.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.page}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.count} abandono{item.count > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-lg font-bold">
                        {item.percentage.toFixed(1)}%
                      </Badge>
                      <div className="w-32 h-2 bg-muted rounded-full mt-2">
                        <div
                          className="h-2 bg-red-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del período */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground text-center">
            Período analizado: {new Date(summary.period.startDate).toLocaleDateString('es-AR')} -{' '}
            {new Date(summary.period.endDate).toLocaleDateString('es-AR')} ({summary.period.days} días)
            <br />
            Generado: {new Date(summary.generatedAt).toLocaleString('es-AR')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
