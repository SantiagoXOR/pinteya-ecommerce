'use client'

/**
 * Componente para analizar carritos abandonados
 * Con métricas, gráficos y lista detallada
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, TrendingDown, DollarSign, Clock, ShoppingCart } from '@/lib/optimized-imports'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AbandonedCartsAnalysis as AbandonedCartsAnalysisType } from '@/lib/analytics/types'

interface AbandonedCartsAnalysisProps {
  startDate?: string
  endDate?: string
}

export const AbandonedCartsAnalysis: React.FC<AbandonedCartsAnalysisProps> = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
}) => {
  const [analysis, setAnalysis] = useState<AbandonedCartsAnalysisType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    startDate: initialStartDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: initialEndDate || new Date().toISOString().split('T')[0],
    minCartValue: '0',
    groupBy: 'session' as 'session' | 'visitor' | 'user',
  })

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('startDate', filters.startDate)
      params.append('endDate', filters.endDate)
      params.append('minCartValue', filters.minCartValue)
      params.append('groupBy', filters.groupBy)

      const response = await fetch(`/api/analytics/abandoned-carts?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error obteniendo análisis de carritos abandonados')
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  const formatTimeAgo = (days: number, hours: number, minutes: number) => {
    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Análisis de Carritos Abandonados</CardTitle>
            <CardDescription>
              Identifica dónde y cuándo los usuarios abandonan sus carritos
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchAnalysis} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <label className="text-sm font-medium mb-1 block">Valor Mínimo</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minCartValue}
                onChange={(e) => setFilters((prev) => ({ ...prev, minCartValue: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Agrupar Por</label>
              <Select
                value={filters.groupBy}
                onValueChange={(value: 'session' | 'visitor' | 'user') =>
                  setFilters((prev) => ({ ...prev, groupBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Session</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={fetchAnalysis}>Aplicar Filtros</Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <div className="text-center py-8">Cargando análisis...</div>}

        {/* Análisis */}
        {!loading && !error && analysis && (
          <div className="space-y-6">
            {/* Métricas Principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Total Abandonados</div>
                  </div>
                  <div className="text-2xl font-bold">{analysis.summary.totalAbandoned}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    de {analysis.summary.totalCarts} carritos
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Valor Abandonado</div>
                  </div>
                  <div className="text-2xl font-bold">
                    ${analysis.summary.totalAbandonedValue.toLocaleString('es-AR')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Promedio: ${Math.round(analysis.summary.averageCartValue).toLocaleString('es-AR')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Tasa de Abandono</div>
                  </div>
                  <div className="text-2xl font-bold">{analysis.summary.abandonmentRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analysis.summary.totalPurchases} compras completadas
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(analysis.summary.averageTimeToAbandonment)}m
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">hasta el abandono</div>
                </CardContent>
              </Card>
            </div>

            {/* Abandono por Página */}
            {analysis.abandonmentByPage.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Abandono por Página</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.abandonmentByPage.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.page}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.count} abandono{item.count > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{item.percentage.toFixed(1)}%</div>
                          <div className="w-32 h-2 bg-muted rounded-full mt-1">
                            <div
                              className="h-2 bg-red-500 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Abandono por Paso */}
            {analysis.abandonmentByStep.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Abandono por Paso del Checkout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.abandonmentByStep.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium capitalize">{item.step}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.count} abandono{item.count > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista Detallada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Carritos Abandonados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Identificador</TableHead>
                        <TableHead>Página de Abandono</TableHead>
                        <TableHead>Última Acción</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Tiempo desde Abandono</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.abandonedCarts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No se encontraron carritos abandonados
                          </TableCell>
                        </TableRow>
                      ) : (
                        analysis.abandonedCarts.map((cart, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline" className="text-xs">
                                  {cart.identifierType}: {cart.identifier.substring(0, 12)}...
                                </Badge>
                                {cart.userId && (
                                  <div className="text-xs text-muted-foreground">
                                    User: {cart.userId.substring(0, 8)}...
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{cart.lastPage}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{cart.lastAction}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${cart.cartValue.toLocaleString('es-AR')}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                {cart.products.length > 0 ? (
                                  <div className="space-y-1">
                                    {cart.products.slice(0, 2).map((product, idx) => (
                                      <div key={idx} className="text-sm">
                                        {product.productName || `Producto ${product.productId}`}
                                        {product.quantity && ` x${product.quantity}`}
                                      </div>
                                    ))}
                                    {cart.products.length > 2 && (
                                      <div className="text-xs text-muted-foreground">
                                        +{cart.products.length - 2} más
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatTimeAgo(
                                  cart.timeSinceAbandonmentDays,
                                  cart.timeSinceAbandonmentHours,
                                  cart.timeSinceAbandonmentMinutes
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(cart.lastEventAt * 1000), 'PPpp', { locale: es })}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
