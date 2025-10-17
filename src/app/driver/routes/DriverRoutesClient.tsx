'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Navigation,
  MapPin,
  Clock,
  Package,
  Play,
  CheckCircle,
  AlertCircle,
  Truck,
  Route,
} from 'lucide-react'
import { useDriver } from '@/contexts/DriverContext'
import { cn } from '@/lib/core/utils'
import Link from 'next/link'

export function DriverRoutesClient() {
  const { driver, startRoute } = useDriver()
  const [routes, setRoutes] = useState([
    {
      id: 1,
      name: 'Ruta Norte',
      status: 'available',
      totalOrders: 5,
      estimatedTime: '2h 30m',
      totalDistance: '45 km',
      completedOrders: 0,
      priority: 'high',
      area: 'Palermo, Recoleta, Belgrano',
    },
    {
      id: 2,
      name: 'Ruta Sur',
      status: 'in_progress',
      totalOrders: 3,
      estimatedTime: '1h 45m',
      totalDistance: '32 km',
      completedOrders: 1,
      priority: 'medium',
      area: 'San Telmo, La Boca, Barracas',
    },
  ])

  const handleStartRoute = (routeId: number) => {
    startRoute()
    // Actualizar estado de la ruta
    setRoutes(prev =>
      prev.map(route =>
        route.id === routeId ? { ...route, status: 'in_progress' } : route
      )
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible'
      case 'in_progress':
        return 'En Progreso'
      case 'completed':
        return 'Completada'
      default:
        return 'Desconocido'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Rutas Asignadas</h1>
          <p className='text-gray-600'>
            Gestiona tus rutas de entrega y navegación
          </p>
        </div>
        <Link href='/driver/dashboard'>
          <Button variant='outline'>
            <Truck className='w-4 h-4 mr-2' />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Routes List */}
      <div className='space-y-4'>
        {routes.map(route => (
          <Card key={route.id} className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-lg'>{route.name}</CardTitle>
                  <CardDescription>{route.area}</CardDescription>
                </div>
                <div className='flex items-center space-x-2'>
                  <Badge className={getStatusColor(route.status)}>
                    {getStatusText(route.status)}
                  </Badge>
                  <Badge variant='outline' className={getPriorityColor(route.priority)}>
                    {route.priority === 'high' ? 'Alta' : route.priority === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                <div className='flex items-center space-x-2'>
                  <Package className='w-4 h-4 text-blue-500' />
                  <div>
                    <p className='text-sm text-gray-600'>Órdenes</p>
                    <p className='font-medium'>{route.completedOrders}/{route.totalOrders}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Clock className='w-4 h-4 text-orange-500' />
                  <div>
                    <p className='text-sm text-gray-600'>Tiempo</p>
                    <p className='font-medium'>{route.estimatedTime}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Route className='w-4 h-4 text-green-500' />
                  <div>
                    <p className='text-sm text-gray-600'>Distancia</p>
                    <p className='font-medium'>{route.totalDistance}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <MapPin className='w-4 h-4 text-purple-500' />
                  <div>
                    <p className='text-sm text-gray-600'>Zona</p>
                    <p className='font-medium text-xs'>{route.area.split(',')[0]}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className='mb-4'>
                <div className='flex justify-between text-sm text-gray-600 mb-1'>
                  <span>Progreso</span>
                  <span>{Math.round((route.completedOrders / route.totalOrders) * 100)}%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${(route.completedOrders / route.totalOrders) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  {route.status === 'available' && (
                    <Button
                      onClick={() => handleStartRoute(route.id)}
                      className='bg-blue-600 hover:bg-blue-700'
                    >
                      <Play className='w-4 h-4 mr-2' />
                      Iniciar Ruta
                    </Button>
                  )}
                  {route.status === 'in_progress' && (
                    <Link href={`/driver/route/${route.id}`}>
                      <Button className='bg-green-600 hover:bg-green-700'>
                        <Navigation className='w-4 h-4 mr-2' />
                        Continuar Navegación
                      </Button>
                    </Link>
                  )}
                  {route.status === 'completed' && (
                    <div className='flex items-center space-x-2 text-green-600'>
                      <CheckCircle className='w-4 h-4' />
                      <span className='text-sm font-medium'>Ruta Completada</span>
                    </div>
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
      {routes.length === 0 && (
        <Card>
          <CardContent className='text-center py-12'>
            <Route className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No hay rutas asignadas
            </h3>
            <p className='text-gray-600 mb-4'>
              Contacta con el administrador para recibir rutas de entrega.
            </p>
            <Button variant='outline'>
              <RefreshCw className='w-4 h-4 mr-2' />
              Actualizar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
