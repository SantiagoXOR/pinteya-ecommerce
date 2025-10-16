/**
 * Página de Acceso Denegado
 * Mostrada cuando un usuario autenticado intenta acceder a rutas sin permisos
 */

'use client'

import Link from 'next/link'
import { Shield, Home, ArrowLeft, User, Truck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// Metadata se maneja en layout.tsx para client components

export default function AccessDeniedPage() {
  const searchParams = useSearchParams()
  const [accessType, setAccessType] = useState<string>('admin')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const type = searchParams.get('type') || 'admin'
    setAccessType(type)
    setIsLoading(false)
  }, [searchParams])

  const getAccessInfo = () => {
    switch (accessType) {
      case 'driver':
        return {
          title: 'Acceso de Repartidor Denegado',
          message: 'No tienes permisos para acceder al área de repartidores.',
          description: 'Esta área está restringida a usuarios con rol de repartidor.',
          icon: Truck,
          color: 'bg-orange-100',
          iconColor: 'text-orange-600',
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-800',
          detailColor: 'text-orange-700'
        }
      case 'admin':
      default:
        return {
          title: 'Acceso Administrativo Denegado',
          message: 'No tienes permisos para acceder al panel administrativo.',
          description: 'Esta área está restringida a usuarios con rol de administrador.',
          icon: Shield,
          color: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          detailColor: 'text-red-700'
        }
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
            <div className='animate-pulse'>
              <div className='h-16 w-16 bg-gray-200 rounded-full mx-auto mb-6'></div>
              <div className='h-8 bg-gray-200 rounded mb-4'></div>
              <div className='h-4 bg-gray-200 rounded mb-6'></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const accessInfo = getAccessInfo()
  const IconComponent = accessInfo.icon

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          {/* Icono de acceso denegado */}
          <div className='flex justify-center mb-6'>
            <div className={`w-16 h-16 ${accessInfo.color} rounded-full flex items-center justify-center`}>
              <IconComponent className={`w-8 h-8 ${accessInfo.iconColor}`} />
            </div>
          </div>

          {/* Título y mensaje */}
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>{accessInfo.title}</h1>
            <p className='text-gray-600 mb-6'>{accessInfo.message}</p>
          </div>

          {/* Información adicional */}
          <div className={`${accessInfo.bgColor} border ${accessInfo.borderColor} rounded-lg p-4 mb-6`}>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <IconComponent className={`h-5 w-5 ${accessInfo.iconColor}`} />
              </div>
              <div className='ml-3'>
                <h3 className={`text-sm font-medium ${accessInfo.textColor}`}>Permisos Insuficientes</h3>
                <div className={`mt-2 text-sm ${accessInfo.detailColor}`}>
                  <p>{accessInfo.description}</p>
                  <p className='mt-2'>
                    Si crees que deberías tener acceso, contacta al administrador del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className='space-y-3'>
            <Link
              href='/'
              className='w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blaze-orange-600 hover:bg-blaze-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blaze-orange-500 transition-colors'
            >
              <Home className='w-4 h-4 mr-2' />
              Ir al Inicio
            </Link>

            <button
              onClick={() => window.history.back()}
              className='w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blaze-orange-500 transition-colors'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Volver Atrás
            </button>
          </div>

          {/* Información de contacto */}
          <div className='mt-6 text-center'>
            <p className='text-xs text-gray-500'>
              ¿Necesitas ayuda? Contacta al administrador del sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
