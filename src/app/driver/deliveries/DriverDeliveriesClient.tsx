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
  Truck,
  Calendar,
} from 'lucide-react'
import { useDriver } from '@/contexts/DriverContext'
import Link from 'next/link'

export function DriverDeliveriesClient() {
  const { driver } = useDriver()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [deliveries] = useState([
    {
      id: 1,
      orderNumber: 'ORD-001',
      status: 'completed',
      completedAt: '2024-01-15T14:30:00Z',
      customerName: 'Juan Pérez',
      address: 'Av. Corrientes 1234, CABA',
      items: ['Pintura Latex Interior x2'],
      total: 45000,
      deliveryTime: '14:30',
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      status: 'in_progress',
      completedAt: null,
      customerName: 'María González',
      address: 'Av. Santa Fe 5678, CABA',
      items: ['Barniz Campbell x1', 'Lija x3'],
      total: 32000,
      deliveryTime: null,
    },
    {
      id: 3,
      orderNumber: 'ORD-003',
      status: 'pending',
      completedAt: null,
      customerName: 'Carlos López',
      address: 'Av. Córdoba 9012, CABA',
      items: ['Cinta Papel x2'],
      total: 18000,
      deliveryTime: null,
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Entregado'
      case 'in_progress':
        return 'En Progreso'
      case 'pending':
        return 'Pendiente'
      case 'failed':
        return 'Fallido'
      default:
        return 'Desconocido'
    }
  }

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className='min-h-screen bg-gray-50 p-4 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Historial de Entregas</h1>
          <p className='text-gray-600'>
            Gestiona y revisa todas tus entregas
          </p>
        </div>
        <Link href='/driver/dashboard'>
          <Button variant='outline'>
            <Truck className='w-4 h-4 mr-2' />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Buscar por número de orden o cliente...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Filter className='w-4 h-4 text-gray-400' />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
              >
                <option value='all'>Todos los estados</option>
                <option value='pending'>Pendientes</option>
                <option value='in_progress'>En Progreso</option>
                <option value='completed'>Completados</option>
                <option value='failed'>Fallidos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      <div className='space-y-4'>
        {filteredDeliveries.map(delivery => (
          <Card key={delivery.id} className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-lg'>{delivery.orderNumber}</CardTitle>
                  <CardDescription>{delivery.customerName}</CardDescription>
                </div>
                <div className='flex items-center space-x-2'>
                  <Badge className={getStatusColor(delivery.status)}>
                    {getStatusText(delivery.status)}
                  </Badge>
                  <Badge variant='outline'>
                    ${delivery.total.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div className='flex items-center space-x-2'>
                  <MapPin className='w-4 h-4 text-blue-500' />
                  <div>
                    <p className='text-sm text-gray-600'>Dirección</p>
                    <p className='font-medium text-sm'>{delivery.address}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Package className='w-4 h-4 text-green-500' />
                  <div>
                    <p className='text-sm text-gray-600'>Productos</p>
                    <p className='font-medium text-sm'>{delivery.items.length} items</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Calendar className='w-4 h-4 text-purple-500' />
                  <div>
                    <p className='text-sm text-gray-600'>
                      {delivery.status === 'completed' ? 'Entregado' : 'Estimado'}
                    </p>
                    <p className='font-medium text-sm'>
                      {delivery.deliveryTime || 'Por definir'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className='mb-4'>
                <p className='text-sm font-medium text-gray-700 mb-2'>Productos:</p>
                <div className='space-y-1'>
                  {delivery.items.map((item, index) => (
                    <div key={index} className='text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded'>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  {delivery.status === 'completed' && (
                    <div className='flex items-center space-x-2 text-green-600'>
                      <CheckCircle className='w-4 h-4' />
                      <span className='text-sm font-medium'>Entregado exitosamente</span>
                    </div>
                  )}
                  {delivery.status === 'in_progress' && (
                    <Link href={`/driver/route/${delivery.id}`}>
                      <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                        <Truck className='w-4 h-4 mr-2' />
                        Continuar Entrega
                      </Button>
                    </Link>
                  )}
                  {delivery.status === 'pending' && (
                    <Link href={`/driver/route/${delivery.id}`}>
                      <Button size='sm' className='bg-green-600 hover:bg-green-700'>
                        <Package className='w-4 h-4 mr-2' />
                        Iniciar Entrega
                      </Button>
                    </Link>
                  )}
                </div>
                <Button variant='outline' size='sm'>
                  Ver Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDeliveries.length === 0 && (
        <Card>
          <CardContent className='text-center py-12'>
            <Package className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No se encontraron entregas
            </h3>
            <p className='text-gray-600 mb-4'>
              {searchTerm || filterStatus !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'No tienes entregas registradas aún.'}
            </p>
            {searchTerm || filterStatus !== 'all' ? (
              <Button
                variant='outline'
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                }}
              >
                Limpiar Filtros
              </Button>
            ) : (
              <Link href='/driver/routes'>
                <Button variant='outline'>
                  <Truck className='w-4 h-4 mr-2' />
                  Ver Rutas
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4 text-center'>
            <CheckCircle className='w-8 h-8 text-green-500 mx-auto mb-2' />
            <p className='text-2xl font-bold text-green-600'>
              {deliveries.filter(d => d.status === 'completed').length}
            </p>
            <p className='text-sm text-gray-600'>Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <Clock className='w-8 h-8 text-blue-500 mx-auto mb-2' />
            <p className='text-2xl font-bold text-blue-600'>
              {deliveries.filter(d => d.status === 'in_progress').length}
            </p>
            <p className='text-sm text-gray-600'>En Progreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <AlertTriangle className='w-8 h-8 text-yellow-500 mx-auto mb-2' />
            <p className='text-2xl font-bold text-yellow-600'>
              {deliveries.filter(d => d.status === 'pending').length}
            </p>
            <p className='text-sm text-gray-600'>Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <Package className='w-8 h-8 text-purple-500 mx-auto mb-2' />
            <p className='text-2xl font-bold text-purple-600'>{deliveries.length}</p>
            <p className='text-sm text-gray-600'>Total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
