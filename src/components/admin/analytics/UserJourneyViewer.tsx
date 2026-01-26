'use client'

/**
 * Componente para visualizar journeys de usuario
 * Con timeline interactivo y análisis de flujo
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Search, CheckCircle, XCircle, AlertCircle } from '@/lib/optimized-imports'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { UserJourney } from '@/lib/analytics/types'

interface UserJourneyViewerProps {
  startDate?: string
  endDate?: string
}

export const UserJourneyViewer: React.FC<UserJourneyViewerProps> = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
}) => {
  const [journey, setJourney] = useState<UserJourney | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    identifier: '',
    identifierType: 'session' as 'session' | 'visitor' | 'user',
    startDate: initialStartDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: initialEndDate || new Date().toISOString().split('T')[0],
  })

  const fetchJourney = async () => {
    if (!filters.identifier) {
      setError('Por favor ingresa un identificador')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('identifier', filters.identifier)
      params.append('identifierType', filters.identifierType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/analytics/journeys?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error obteniendo journey')
      }

      const data = await response.json()
      setJourney(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setJourney(null)
    } finally {
      setLoading(false)
    }
  }

  const getEventColor = (action: string) => {
    if (action === 'purchase') return 'bg-green-100 text-green-800 border-green-300'
    if (action === 'add_to_cart' || action === 'add') return 'bg-blue-100 text-blue-800 border-blue-300'
    if (action === 'begin_checkout') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (action === 'remove_from_cart' || action === 'remove') return 'bg-red-100 text-red-800 border-red-300'
    return 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Journey</CardTitle>
            <CardDescription>
              Visualiza el recorrido completo de un usuario en el sitio
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchJourney} disabled={loading || !filters.identifier}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Buscar Journey
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo de Identificador</label>
              <Select
                value={filters.identifierType}
                onValueChange={(value: 'session' | 'visitor' | 'user') =>
                  setFilters((prev) => ({ ...prev, identifierType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Session Hash</SelectItem>
                  <SelectItem value="visitor">Visitor Hash</SelectItem>
                  <SelectItem value="user">User ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Identificador</label>
              <Input
                placeholder="Ingresa el identificador"
                value={filters.identifier}
                onChange={(e) => setFilters((prev) => ({ ...prev, identifier: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && fetchJourney()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Fecha Inicio</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Fecha Fin</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <div className="text-center py-8">Cargando journey...</div>}

        {/* Journey */}
        {!loading && !error && journey && (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Total Eventos</div>
                <div className="text-2xl font-bold">{journey.summary.totalEvents}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Páginas Visitadas</div>
                <div className="text-2xl font-bold">{journey.summary.totalPages}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Duración</div>
                <div className="text-2xl font-bold">{Math.round(journey.summary.duration)}m</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Estado</div>
                <div className="flex items-center gap-2 mt-1">
                  {journey.summary.hasConversion ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Convertido
                    </Badge>
                  ) : journey.summary.hasAbandonment ? (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Abandonado
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      En Progreso
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Timeline de Eventos</h3>
              <div className="space-y-2">
                {journey.timeline.map((event, index) => (
                  <div
                    key={event.eventId}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.timestamp * 1000), 'HH:mm:ss', { locale: es })}
                      </div>
                      {index > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          +{formatDuration(event.timeSincePrev)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getEventColor(event.action)}>{event.action}</Badge>
                        <span className="text-sm font-medium">{event.category}</span>
                        {event.page && (
                          <span className="text-sm text-muted-foreground">→ {event.page}</span>
                        )}
                      </div>
                      {event.productName && (
                        <div className="text-sm text-muted-foreground">
                          Producto: {event.productName}
                          {event.quantity && ` x${event.quantity}`}
                          {event.price && ` ($${event.price.toLocaleString('es-AR')})`}
                        </div>
                      )}
                      {event.label && (
                        <div className="text-sm text-muted-foreground">Label: {event.label}</div>
                      )}
                      {event.value !== undefined && event.value !== null && (
                        <div className="text-sm text-muted-foreground">
                          Valor: ${event.value.toLocaleString('es-AR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Puntos de Conversión */}
            {journey.conversionPoints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Puntos de Conversión</h3>
                <div className="space-y-2">
                  {journey.conversionPoints.map((point, index) => (
                    <div
                      key={index}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">Compra Realizada</span>
                      </div>
                      <div className="text-sm text-green-700">
                        <div>
                          Fecha: {format(new Date(point.timestamp * 1000), 'PPpp', { locale: es })}
                        </div>
                        <div>Página: {point.page}</div>
                        <div>Valor: ${point.value.toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Puntos de Abandono */}
            {journey.abandonmentPoints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Puntos de Abandono</h3>
                <div className="space-y-2">
                  {journey.abandonmentPoints.map((point, index) => (
                    <div
                      key={index}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-800">Carrito Abandonado</span>
                      </div>
                      <div className="text-sm text-red-700">
                        <div>
                          Fecha: {format(new Date(point.timestamp * 1000), 'PPpp', { locale: es })}
                        </div>
                        <div>Página: {point.page}</div>
                        <div>Última Acción: {point.lastAction}</div>
                        <div>Valor del Carrito: ${point.cartValue.toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !journey && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingresa un identificador y busca el journey del usuario</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
