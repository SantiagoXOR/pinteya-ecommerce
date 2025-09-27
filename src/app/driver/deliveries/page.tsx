/**
 * Página de gestión de entregas para drivers
 * Historial y estado de todas las entregas
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Package,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Phone,
  Calendar,
  Truck,
} from 'lucide-react'
import { cn } from '@/lib/core/utils'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'

interface Delivery {
  id: string
  route_id: string
  route_name: string
  tracking_number: string
  customer_name: string
  customer_phone?: string
  destination: {
    address: string
    city: string
    postal_code: string
  }
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'exception'
  created_at: string
  delivered_at?: string
}

export default function DriverDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    in_transit: 0,
    delivered: 0,
    exception: 0,
  })

  useEffect(() => {
    loadDeliveries()
  }, [dateFilter])

  useEffect(() => {
    filterDeliveries()
  }, [deliveries, searchTerm, statusFilter])

  const loadDeliveries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.append('date', dateFilter)

      const response = await fetch(`/api/driver/deliveries?${params}`)
      const data = await response.json()

      if (data.deliveries) {
        setDeliveries(data.deliveries)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDeliveries = () => {
    let filtered = deliveries

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        delivery =>
          delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          delivery.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          delivery.destination.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === statusFilter)
    }

    setFilteredDeliveries(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'in_transit':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'exception':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'confirmed':
        return 'Confirmado'
      case 'in_transit':
        return 'En Tránsito'
      case 'delivered':
        return 'Entregado'
      case 'exception':
        return 'Excepción'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-4 w-4' />
      case 'confirmed':
        return <Package className='h-4 w-4' />
      case 'in_transit':
        return <Truck className='h-4 w-4' />
      case 'delivered':
        return <CheckCircle className='h-4 w-4' />
      case 'exception':
        return <AlertTriangle className='h-4 w-4' />
      default:
        return <Package className='h-4 w-4' />
    }
  }

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p>Cargando entregas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='p-4 space-y-6 max-w-md mx-auto'>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            Mis Entregas
          </CardTitle>
          <CardDescription>Historial y gestión de entregas</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Selector de fecha */}
          <div className='flex items-center space-x-2'>
            <Calendar className='h-4 w-4 text-gray-500' />
            <input
              type='date'
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm'
            />
          </div>

          {/* Búsqueda */}
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Buscar por cliente, tracking o dirección...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>

          {/* Filtro por estado */}
          <div className='flex items-center space-x-2'>
            <Filter className='h-4 w-4 text-gray-500' />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm'
            >
              <option value='all'>Todos los estados</option>
              <option value='pending'>Pendientes</option>
              <option value='confirmed'>Confirmados</option>
              <option value='in_transit'>En Tránsito</option>
              <option value='delivered'>Entregados</option>
              <option value='exception'>Excepciones</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className='grid grid-cols-3 gap-2'>
        <Card>
          <CardContent className='p-3 text-center'>
            <div className='text-lg font-bold text-blue-600'>{stats.confirmed}</div>
            <div className='text-xs text-gray-600'>Confirmados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-3 text-center'>
            <div className='text-lg font-bold text-purple-600'>{stats.in_transit}</div>
            <div className='text-xs text-gray-600'>En Tránsito</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-3 text-center'>
            <div className='text-lg font-bold text-green-600'>{stats.delivered}</div>
            <div className='text-xs text-gray-600'>Entregados</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de entregas */}
      <div className='space-y-3'>
        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map(delivery => (
            <Card key={delivery.id} className='border-gray-200'>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2 mb-1'>
                      <h3 className='font-semibold text-gray-900'>{delivery.customer_name}</h3>
                      {delivery.customer_phone && (
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleCallCustomer(delivery.customer_phone!)}
                          className='h-6 w-6 p-0'
                        >
                          <Phone className='h-3 w-3' />
                        </Button>
                      )}
                    </div>
                    <p className='text-sm text-gray-600 mb-2'>#{delivery.tracking_number}</p>
                    <div className='flex items-center space-x-1 text-xs text-gray-500'>
                      <MapPin className='h-3 w-3' />
                      <span className='truncate'>{delivery.destination.address}</span>
                    </div>
                  </div>

                  <div className='text-right'>
                    <Badge className={cn('mb-2', getStatusColor(delivery.status))}>
                      <div className='flex items-center space-x-1'>
                        {getStatusIcon(delivery.status)}
                        <span>{getStatusText(delivery.status)}</span>
                      </div>
                    </Badge>
                    <p className='text-xs text-gray-500'>{delivery.route_name}</p>
                  </div>
                </div>

                {delivery.delivered_at && (
                  <div className='text-xs text-green-600 bg-green-50 p-2 rounded'>
                    Entregado: {new Date(delivery.delivered_at).toLocaleString('es-AR')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className='text-center py-8'>
              <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='font-medium text-gray-900 mb-2'>No se encontraron entregas</h3>
              <p className='text-sm text-gray-600'>
                {searchTerm || statusFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No hay entregas para esta fecha'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
