'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Truck,
  Phone,
  Mail,
  MapPin,
  Settings,
  Edit,
  Save,
  X,
  Calendar,
  Clock,
  Award,
  TrendingUp,
} from '@/lib/optimized-imports'
import { useDriver } from '@/contexts/DriverContext'
import Link from 'next/link'

export function DriverProfileClient() {
  const { driver } = useDriver()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: driver?.name || 'Juan Pérez',
    email: driver?.email || 'driver@pinteya.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234, CABA',
    licenseNumber: 'D12345678',
    vehicleInfo: 'Ford Transit 2020',
  })

  const handleSave = () => {
    // Aquí se haría la llamada a la API para actualizar el perfil
    console.log('Guardando perfil:', formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: driver?.name || 'Juan Pérez',
      email: driver?.email || 'driver@pinteya.com',
      phone: '+54 11 1234-5678',
      address: 'Av. Corrientes 1234, CABA',
      licenseNumber: 'D12345678',
      vehicleInfo: 'Ford Transit 2020',
    })
    setIsEditing(false)
  }

  const stats = [
    {
      title: 'Entregas Totales',
      value: '247',
      change: '+12%',
      changeType: 'positive',
      icon: Truck,
    },
    {
      title: 'Tiempo Promedio',
      value: '28 min',
      change: '-5%',
      changeType: 'positive',
      icon: Clock,
    },
    {
      title: 'Calificación',
      value: '4.8',
      change: '+0.1',
      changeType: 'positive',
      icon: Award,
    },
    {
      title: 'Ingresos del Mes',
      value: '$45,600',
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp,
    },
  ]

  return (
    <div className='min-h-screen bg-gray-50 p-4 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Mi Perfil</h1>
          <p className='text-gray-600'>
            Gestiona tu información personal y ve tus estadísticas
          </p>
        </div>
        <Link href='/driver/dashboard'>
          <Button variant='outline'>
            <Truck className='w-4 h-4 mr-2' />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Tu información de contacto y datos del vehículo
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant='outline'>
                <Edit className='w-4 h-4 mr-2' />
                Editar
              </Button>
            ) : (
              <div className='flex space-x-2'>
                <Button onClick={handleSave} size='sm'>
                  <Save className='w-4 h-4 mr-2' />
                  Guardar
                </Button>
                <Button onClick={handleCancel} variant='outline' size='sm'>
                  <X className='w-4 h-4 mr-2' />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <User className='w-5 h-5 text-blue-500' />
                <div className='flex-1'>
                  <label className='text-sm font-medium text-gray-700'>Nombre</label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md mt-1'
                    />
                  ) : (
                    <p className='text-gray-900'>{formData.name}</p>
                  )}
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <Mail className='w-5 h-5 text-green-500' />
                <div className='flex-1'>
                  <label className='text-sm font-medium text-gray-700'>Email</label>
                  {isEditing ? (
                    <input
                      type='email'
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md mt-1'
                    />
                  ) : (
                    <p className='text-gray-900'>{formData.email}</p>
                  )}
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <Phone className='w-5 h-5 text-purple-500' />
                <div className='flex-1'>
                  <label className='text-sm font-medium text-gray-700'>Teléfono</label>
                  {isEditing ? (
                    <input
                      type='tel'
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md mt-1'
                    />
                  ) : (
                    <p className='text-gray-900'>{formData.phone}</p>
                  )}
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <MapPin className='w-5 h-5 text-red-500' />
                <div className='flex-1'>
                  <label className='text-sm font-medium text-gray-700'>Dirección</label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md mt-1'
                    />
                  ) : (
                    <p className='text-gray-900'>{formData.address}</p>
                  )}
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <Truck className='w-5 h-5 text-orange-500' />
                <div className='flex-1'>
                  <label className='text-sm font-medium text-gray-700'>Vehículo</label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={formData.vehicleInfo}
                      onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md mt-1'
                    />
                  ) : (
                    <p className='text-gray-900'>{formData.vehicleInfo}</p>
                  )}
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <Award className='w-5 h-5 text-yellow-500' />
                <div className='flex-1'>
                  <label className='text-sm font-medium text-gray-700'>Licencia</label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md mt-1'
                    />
                  ) : (
                    <p className='text-gray-900'>{formData.licenseNumber}</p>
                  )}
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <Calendar className='w-5 h-5 text-indigo-500' />
                <div className='flex-1'>
                  <label className='text-sm font-medium text-gray-700'>Miembro desde</label>
                  <p className='text-gray-900'>Enero 2024</p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <Badge className='bg-green-100 text-green-800'>
                  Activo
                </Badge>
                <Badge variant='outline'>
                  Driver Verificado
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index}>
              <CardContent className='p-4'>
                <div className='flex items-center space-x-3'>
                  <IconComponent className='w-8 h-8 text-blue-500' />
                  <div>
                    <p className='text-sm text-gray-600'>{stat.title}</p>
                    <p className='text-lg font-bold text-gray-900'>{stat.value}</p>
                    <p className={`text-xs ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} vs mes anterior
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Tus entregas y actividades de los últimos días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[
              {
                action: 'Entrega completada',
                order: 'ORD-001',
                time: 'Hace 2 horas',
                status: 'completed',
              },
              {
                action: 'Ruta iniciada',
                route: 'Ruta Norte',
                time: 'Hace 4 horas',
                status: 'in_progress',
              },
              {
                action: 'Entrega completada',
                order: 'ORD-002',
                time: 'Ayer',
                status: 'completed',
              },
            ].map((activity, index) => (
              <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div className='flex items-center space-x-3'>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className='text-sm font-medium'>{activity.action}</p>
                    <p className='text-xs text-gray-600'>
                      {activity.order || activity.route} • {activity.time}
                    </p>
                  </div>
                </div>
                <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                  {activity.status === 'completed' ? 'Completado' : 'En Progreso'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
