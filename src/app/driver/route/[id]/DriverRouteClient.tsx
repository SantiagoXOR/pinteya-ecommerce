'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Navigation,
  MapPin,
  CheckCircle,
  Clock,
  Package,
  ArrowLeft,
  Phone,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import { useDriver } from '@/contexts/DriverContext'
import Link from 'next/link'

export function DriverRouteClient() {
  const { driver, updateLocation, completeDelivery } = useDriver()
  const params = useParams()
  const routeId = params.id

  const [currentStep, setCurrentStep] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [estimatedArrival, setEstimatedArrival] = useState('14:30')

  // Mock data para la ruta
  const [routeData] = useState({
    id: routeId,
    name: 'Ruta Norte',
    status: 'in_progress',
    totalSteps: 3,
    currentStep: 0,
    estimatedTime: '2h 30m',
    totalDistance: '45 km',
    steps: [
      {
        id: 1,
        type: 'pickup',
        address: 'Depósito Central - Av. Industrial 1234',
        orderNumber: null,
        customerName: 'Depósito',
        phone: '+54 11 1234-5678',
        status: 'completed',
        estimatedTime: '10:00',
        actualTime: '10:05',
      },
      {
        id: 2,
        type: 'delivery',
        address: 'Av. Corrientes 1234, 5°A, CABA',
        orderNumber: 'ORD-001',
        customerName: 'Juan Pérez',
        phone: '+54 11 2345-6789',
        status: 'current',
        estimatedTime: '12:00',
        actualTime: null,
      },
      {
        id: 3,
        type: 'delivery',
        address: 'Av. Santa Fe 5678, CABA',
        orderNumber: 'ORD-002',
        customerName: 'María González',
        phone: '+54 11 3456-7890',
        status: 'pending',
        estimatedTime: '14:00',
        actualTime: null,
      },
    ],
  })

  const currentStepData = routeData.steps[currentStep]

  const handleStartNavigation = () => {
    setIsNavigating(true)
    updateLocation()
  }

  const handleCompleteStep = () => {
    if (currentStepData.status === 'current') {
      // Marcar como completado
      completeDelivery(currentStepData.orderNumber || '')
      
      // Mover al siguiente paso
      if (currentStep < routeData.steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleCallCustomer = () => {
    // Implementar llamada telefónica
    console.log('Llamando a:', currentStepData.phone)
  }

  const handleMessageCustomer = () => {
    // Implementar envío de mensaje
    console.log('Enviando mensaje a:', currentStepData.customerName)
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link href='/driver/routes'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{routeData.name}</h1>
            <p className='text-gray-600'>
              Paso {currentStep + 1} de {routeData.steps.length}
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Badge className='bg-blue-100 text-blue-800'>
            En Progreso
          </Badge>
          <Badge variant='outline'>
            {routeData.estimatedTime} restantes
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex justify-between text-sm text-gray-600 mb-2'>
            <span>Progreso de la Ruta</span>
            <span>{Math.round(((currentStep + 1) / routeData.steps.length) * 100)}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3'>
            <div
              className='bg-blue-600 h-3 rounded-full transition-all duration-500'
              style={{
                width: `${((currentStep + 1) / routeData.steps.length) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStepData.type === 'pickup' 
                ? 'bg-blue-500' 
                : 'bg-green-500'
            }`}>
              {currentStepData.type === 'pickup' ? (
                <Package className='w-4 h-4 text-white' />
              ) : (
                <CheckCircle className='w-4 h-4 text-white' />
              )}
            </div>
            <span>
              {currentStepData.type === 'pickup' ? 'Recogida' : 'Entrega'}
              {currentStepData.orderNumber && ` - ${currentStepData.orderNumber}`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-start space-x-3'>
              <MapPin className='w-5 h-5 text-red-500 mt-1' />
              <div>
                <p className='font-medium text-gray-900'>{currentStepData.address}</p>
                <p className='text-sm text-gray-600'>
                  {currentStepData.customerName}
                </p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <Clock className='w-5 h-5 text-blue-500' />
              <div>
                <p className='text-sm text-gray-600'>Tiempo estimado</p>
                <p className='font-medium'>
                  {currentStepData.estimatedTime}
                  {currentStepData.actualTime && ` (Llegada: ${currentStepData.actualTime})`}
                </p>
              </div>
            </div>

            {currentStepData.type === 'delivery' && (
              <div className='flex items-center space-x-3'>
                <Phone className='w-5 h-5 text-green-500' />
                <div>
                  <p className='text-sm text-gray-600'>Teléfono del cliente</p>
                  <p className='font-medium'>{currentStepData.phone}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className='flex flex-wrap gap-3 pt-4'>
              {!isNavigating ? (
                <Button onClick={handleStartNavigation} className='bg-blue-600 hover:bg-blue-700'>
                  <Navigation className='w-4 h-4 mr-2' />
                  Iniciar Navegación
                </Button>
              ) : (
                <Button 
                  onClick={handleCompleteStep}
                  className='bg-green-600 hover:bg-green-700'
                >
                  <CheckCircle className='w-4 h-4 mr-2' />
                  {currentStepData.type === 'pickup' ? 'Recogida Completada' : 'Entrega Completada'}
                </Button>
              )}

              {currentStepData.type === 'delivery' && (
                <>
                  <Button variant='outline' onClick={handleCallCustomer}>
                    <Phone className='w-4 h-4 mr-2' />
                    Llamar Cliente
                  </Button>
                  <Button variant='outline' onClick={handleMessageCustomer}>
                    <MessageSquare className='w-4 h-4 mr-2' />
                    Mensaje
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Pasos de la Ruta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {routeData.steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-4 p-4 rounded-lg border ${
                  step.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : step.status === 'current'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-green-500'
                      : step.status === 'current'
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className='w-4 h-4 text-white' />
                  ) : (
                    <span className='text-white text-sm font-medium'>{index + 1}</span>
                  )}
                </div>

                <div className='flex-1'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {step.type === 'pickup' ? 'Recogida' : 'Entrega'}
                        {step.orderNumber && ` - ${step.orderNumber}`}
                      </p>
                      <p className='text-sm text-gray-600'>{step.address}</p>
                      <p className='text-sm text-gray-600'>{step.customerName}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium text-gray-900'>
                        {step.estimatedTime}
                      </p>
                      {step.actualTime && (
                        <p className='text-xs text-green-600'>
                          Llegada: {step.actualTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {step.status === 'current' && (
                  <Badge className='bg-blue-100 text-blue-800'>
                    Actual
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Status */}
      {isNavigating && (
        <Card className='border-blue-200 bg-blue-50'>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='w-3 h-3 bg-blue-500 rounded-full animate-pulse' />
              <div>
                <p className='font-medium text-blue-900'>Navegación Activa</p>
                <p className='text-sm text-blue-700'>
                  Llegada estimada: {estimatedArrival}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      <Card className='border-red-200 bg-red-50'>
        <CardContent className='p-4'>
          <div className='flex items-center space-x-3'>
            <AlertCircle className='w-5 h-5 text-red-500' />
            <div>
              <p className='font-medium text-red-900'>Contacto de Emergencia</p>
              <p className='text-sm text-red-700'>
                Si tienes problemas, contacta al soporte: +54 11 9999-9999
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
