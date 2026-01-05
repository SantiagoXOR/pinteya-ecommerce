'use client'

import React, { useEffect, useState } from 'react'
import { LoadScript } from '@react-google-maps/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Navigation } from '@/lib/optimized-imports'
import { MapPin } from '@/lib/optimized-imports'
import { Clock } from '@/lib/optimized-imports'
import { Package } from '@/lib/optimized-imports'
import { CheckCircle } from '@/lib/optimized-imports'
import { AlertCircle } from '@/lib/optimized-imports'
import { Truck } from '@/lib/optimized-imports'
import { Route } from '@/lib/optimized-imports'
import { Play } from '@/lib/optimized-imports'
import { Pause } from '@/lib/optimized-imports'
import { MoreVertical } from '@/lib/optimized-imports'
import { List } from '@/lib/optimized-imports'
import { Map } from '@/lib/optimized-imports'
import { useDriver } from '@/contexts/DriverContext'
import { cn } from '@/lib/core/utils'
import Link from 'next/link'
import PendingOrdersList from '@/components/driver/PendingOrdersList'
import LiveNavigationMap from '@/components/driver/LiveNavigationMap'

export function DriverDashboardClient() {
  const { driver, isOnline, updateLocation, startRoute, completeDelivery } = useDriver()
  const [activeTab, setActiveTab] = useState('overview')
  const [isNavigating, setIsNavigating] = useState(false)

  // Estados de órdenes pendientes (mock data)
  const [pendingOrders] = useState([
    {
      id: 1,
      orderNumber: 'ORD-001',
      total: 45000,
      status: 'pending',
      paymentStatus: 'paid',
      fulfillmentStatus: 'ready',
      createdAt: '2024-01-15T10:30:00Z',
      estimatedDelivery: '2024-01-15T14:00:00Z',
      shippingAddress: {
        streetName: 'Av. Corrientes',
        streetNumber: '1234',
        floor: '5',
        apartment: 'A',
        cityName: 'Buenos Aires',
        stateName: 'CABA',
        zipCode: '1043',
        fullAddress: 'Av. Corrientes 1234, 5°A, CABA',
      },
      items: [
        {
          id: 1,
          productName: 'Pintura Latex Interior',
          quantity: 2,
          price: 15000,
          weight: 10,
        },
      ],
    },
  ])

  const handleStartNavigation = () => {
    setIsNavigating(true)
    startRoute()
  }

  const handleCompleteDelivery = (orderId: number) => {
    completeDelivery(orderId)
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      libraries={['places']}
    >
      <div className='min-h-screen bg-gray-50 p-4 space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Dashboard Driver</h1>
            <p className='text-gray-600'>
              Bienvenido, {driver?.name || 'Driver'}
            </p>
          </div>
          <div className='flex items-center space-x-3'>
            <Badge
              variant={isOnline ? 'default' : 'secondary'}
              className={cn(
                'flex items-center space-x-1',
                isOnline ? 'bg-green-500' : 'bg-gray-500'
              )}
            >
              <div className={cn('w-2 h-2 rounded-full', isOnline ? 'bg-white' : 'bg-gray-300')} />
              <span>{isOnline ? 'En línea' : 'Desconectado'}</span>
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Package className='w-5 h-5 text-blue-500' />
                <div>
                  <p className='text-sm text-gray-600'>Entregas Hoy</p>
                  <p className='text-lg font-bold'>3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Clock className='w-5 h-5 text-orange-500' />
                <div>
                  <p className='text-sm text-gray-600'>Tiempo Activo</p>
                  <p className='text-lg font-bold'>4h 30m</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Route className='w-5 h-5 text-green-500' />
                <div>
                  <p className='text-sm text-gray-600'>Rutas Completadas</p>
                  <p className='text-lg font-bold'>2</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-5 h-5 text-purple-500' />
                <div>
                  <p className='text-sm text-gray-600'>Entregas Exitosas</p>
                  <p className='text-lg font-bold'>8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='overview' className='flex items-center space-x-2'>
              <List className='w-4 h-4' />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value='orders' className='flex items-center space-x-2'>
              <Package className='w-4 h-4' />
              <span>Órdenes</span>
            </TabsTrigger>
            <TabsTrigger value='navigation' className='flex items-center space-x-2'>
              <Map className='w-4 h-4' />
              <span>Navegación</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Estado Actual</CardTitle>
                <CardDescription>
                  Información de tu estado y próximas acciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <CheckCircle className='w-6 h-6 text-green-500' />
                      <div>
                        <p className='font-medium text-green-900'>Listo para entregas</p>
                        <p className='text-sm text-green-700'>Tienes órdenes pendientes</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleStartNavigation}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      <Navigation className='w-4 h-4 mr-2' />
                      Iniciar Ruta
                    </Button>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>Próxima Entrega</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          <p className='font-medium'>ORD-001</p>
                          <p className='text-sm text-gray-600'>Av. Corrientes 1234</p>
                          <p className='text-sm text-gray-600'>Estimado: 14:00</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>Estado del Vehículo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          <div className='flex justify-between'>
                            <span>Combustible:</span>
                            <span className='text-green-600'>75%</span>
                          </div>
                          <div className='flex justify-between'>
                            <span>Kilometraje:</span>
                            <span>45,230 km</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='orders' className='space-y-4'>
            <PendingOrdersList
              orders={pendingOrders}
              onCompleteDelivery={handleCompleteDelivery}
            />
          </TabsContent>

          <TabsContent value='navigation' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Navegación GPS</CardTitle>
                <CardDescription>
                  Mapa en tiempo real y navegación activa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LiveNavigationMap
                  isNavigating={isNavigating}
                  onNavigationComplete={() => setIsNavigating(false)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className='flex justify-center space-x-4'>
          <Link href='/driver/routes'>
            <Button variant='outline' className='flex items-center space-x-2'>
              <Route className='w-4 h-4' />
              <span>Ver Rutas</span>
            </Button>
          </Link>
          <Link href='/driver/deliveries'>
            <Button variant='outline' className='flex items-center space-x-2'>
              <Package className='w-4 h-4' />
              <span>Entregas</span>
            </Button>
          </Link>
          <Link href='/driver/profile'>
            <Button variant='outline' className='flex items-center space-x-2'>
              <Truck className='w-4 h-4' />
              <span>Perfil</span>
            </Button>
          </Link>
        </div>
      </div>
    </LoadScript>
  )
}
