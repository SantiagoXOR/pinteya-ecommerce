'use client'

/**
 * Componente para visualizar eventos raw de analytics
 * Con filtros, paginación y exportación
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, Filter, ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AnalyticsEvent {
  id: string
  created_at: number
  session_hash?: number
  visitor_hash?: string
  user_id?: string
  analytics_event_types?: { name: string }
  analytics_categories?: { name: string }
  analytics_actions?: { name: string }
  analytics_pages?: { path: string }
  label?: string
  value?: number
  product_id?: number
  product_name?: string
  category_name?: string
  price?: number
  quantity?: number
}

interface AnalyticsEventsViewerProps {
  startDate?: string
  endDate?: string
}

export const AnalyticsEventsViewer: React.FC<AnalyticsEventsViewerProps> = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
}) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    startDate: initialStartDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: initialEndDate || new Date().toISOString().split('T')[0],
    sessionHash: '',
    visitorHash: '',
    userId: '',
    eventType: '',
    action: '',
    limit: 100,
    offset: 0,
  })
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false,
  })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.sessionHash) params.append('sessionHash', filters.sessionHash)
      if (filters.visitorHash) params.append('visitorHash', filters.visitorHash)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.eventType) params.append('eventType', filters.eventType)
      if (filters.action) params.append('action', filters.action)
      params.append('limit', filters.limit.toString())
      params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/analytics/events/raw?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error obteniendo eventos')
      }

      const data = await response.json()
      setEvents(data.events || [])
      setPagination(data.pagination || { total: 0, limit: 100, offset: 0, hasMore: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [filters.offset])

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }))
  }

  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, offset: 0 }))
    fetchEvents()
  }

  const handleResetFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      sessionHash: '',
      visitorHash: '',
      userId: '',
      eventType: '',
      action: '',
      limit: 100,
      offset: 0,
    })
  }

  const toggleRowExpansion = (eventId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Fecha',
      'Session Hash',
      'Visitor Hash',
      'User ID',
      'Tipo',
      'Categoría',
      'Acción',
      'Página',
      'Label',
      'Valor',
      'Producto',
      'Precio',
      'Cantidad',
    ]

    const rows = events.map((event) => [
      event.id,
      new Date(event.created_at * 1000).toISOString(),
      event.session_hash?.toString() || '',
      event.visitor_hash || '',
      event.user_id || '',
      event.analytics_event_types?.name || '',
      event.analytics_categories?.name || '',
      event.analytics_actions?.name || '',
      event.analytics_pages?.path || '',
      event.label || '',
      event.value?.toString() || '',
      event.product_name || '',
      event.price?.toString() || '',
      event.quantity?.toString() || '',
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analytics-events-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Eventos Raw de Analytics</CardTitle>
            <CardDescription>
              Visualiza todos los eventos capturados en la base de datos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchEvents} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={events.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <span className="font-semibold">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Fecha Inicio</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Fecha Fin</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Session Hash</label>
              <Input
                placeholder="Filtrar por session hash"
                value={filters.sessionHash}
                onChange={(e) => handleFilterChange('sessionHash', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Visitor Hash</label>
              <Input
                placeholder="Filtrar por visitor hash"
                value={filters.visitorHash}
                onChange={(e) => handleFilterChange('visitorHash', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">User ID</label>
              <Input
                placeholder="Filtrar por user ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo de Evento</label>
              <Input
                placeholder="Filtrar por tipo"
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Acción</label>
              <Input
                placeholder="Filtrar por acción"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Límite</label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters}>Aplicar Filtros</Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Resetear
            </Button>
          </div>
        </div>

        {/* Tabla de eventos */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {loading && <div className="text-center py-8">Cargando eventos...</div>}

        {!loading && !error && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Session/Visitor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No se encontraron eventos
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <React.Fragment key={event.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleRowExpansion(event.id)}
                        >
                          <TableCell>
                            {format(new Date(event.created_at * 1000), 'PPpp', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {event.session_hash && (
                                <Badge variant="outline" className="text-xs">
                                  S: {event.session_hash}
                                </Badge>
                              )}
                              {event.visitor_hash && (
                                <Badge variant="outline" className="text-xs">
                                  V: {event.visitor_hash.substring(0, 8)}...
                                </Badge>
                              )}
                              {event.user_id && (
                                <Badge variant="outline" className="text-xs">
                                  U: {event.user_id.substring(0, 8)}...
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{event.analytics_event_types?.name || '-'}</TableCell>
                          <TableCell>{event.analytics_categories?.name || '-'}</TableCell>
                          <TableCell>{event.analytics_actions?.name || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {event.analytics_pages?.path || '-'}
                          </TableCell>
                          <TableCell>
                            {event.product_name ? (
                              <div>
                                <div className="font-medium">{event.product_name}</div>
                                {event.quantity && (
                                  <div className="text-xs text-muted-foreground">
                                    x{event.quantity}
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {event.value !== undefined && event.value !== null
                              ? `$${event.value.toLocaleString('es-AR')}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {expandedRows.has(event.id) ? '▼' : '▶'}
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(event.id) && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/30">
                              <div className="p-4 space-y-2 text-sm">
                                <div>
                                  <strong>ID:</strong> {event.id}
                                </div>
                                {event.label && (
                                  <div>
                                    <strong>Label:</strong> {event.label}
                                  </div>
                                )}
                                {event.price && (
                                  <div>
                                    <strong>Precio:</strong> ${event.price.toLocaleString('es-AR')}
                                  </div>
                                )}
                                {event.category_name && (
                                  <div>
                                    <strong>Categoría Producto:</strong> {event.category_name}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {filters.offset + 1} - {Math.min(filters.offset + filters.limit, pagination.total)} de{' '}
                {pagination.total} eventos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
                  disabled={filters.offset === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
                  disabled={!pagination.hasMore || loading}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
