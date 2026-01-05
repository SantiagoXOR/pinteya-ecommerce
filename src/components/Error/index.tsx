// ===================================
// ERROR COMPONENT
// ===================================
// Componente de error para páginas de error

'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from '@/lib/optimized-imports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ===================================
// INTERFACES
// ===================================

interface ErrorPageProps {
  /** Código de error */
  errorCode?: string | number
  /** Título del error */
  title?: string
  /** Descripción del error */
  description?: string
  /** Mostrar botón de retry */
  showRetry?: boolean
  /** Mostrar botón de volver */
  showGoBack?: boolean
  /** Callback para retry */
  onRetry?: () => void
  /** Callback para volver */
  onGoBack?: () => void
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorCode = '404',
  title,
  description,
  showRetry = false,
  showGoBack = true,
  onRetry,
  onGoBack,
}) => {
  // Configuración por defecto basada en el código de error
  const getErrorConfig = (code: string | number) => {
    const codeStr = String(code)

    switch (codeStr) {
      case '404':
        return {
          title: title || 'Página no encontrada',
          description:
            description || 'La página que buscás no existe o fue movida a otra ubicación.',
          icon: <AlertTriangle className='w-16 h-16 text-yellow-500' />,
          color: 'yellow',
        }
      case '500':
        return {
          title: title || 'Error interno del servidor',
          description:
            description || 'Ocurrió un error inesperado. Nuestro equipo ha sido notificado.',
          icon: <AlertTriangle className='w-16 h-16 text-red-500' />,
          color: 'red',
        }
      case '403':
        return {
          title: title || 'Acceso denegado',
          description: description || 'No tenés permisos para acceder a esta página.',
          icon: <AlertTriangle className='w-16 h-16 text-orange-500' />,
          color: 'orange',
        }
      default:
        return {
          title: title || 'Error',
          description: description || 'Ocurrió un error inesperado.',
          icon: <AlertTriangle className='w-16 h-16 text-gray-500' />,
          color: 'gray',
        }
    }
  }

  const errorConfig = getErrorConfig(errorCode)

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack()
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='max-w-md w-full'>
        <Card className='text-center'>
          <CardHeader className='pb-4'>
            {/* Icono de error */}
            <div className='mx-auto mb-4'>{errorConfig.icon}</div>

            {/* Código de error */}
            <div className='text-6xl font-bold text-gray-300 mb-2'>{errorCode}</div>

            {/* Título */}
            <CardTitle className='text-2xl text-gray-900'>{errorConfig.title}</CardTitle>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Descripción */}
            <p className='text-gray-600 leading-relaxed'>{errorConfig.description}</p>

            {/* Sugerencias */}
            <div className='bg-gray-50 rounded-lg p-4 text-left'>
              <h4 className='font-semibold text-gray-900 mb-2'>¿Qué podés hacer?</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Verificá que la URL esté escrita correctamente</li>
                <li>• Volvé a la página anterior</li>
                <li>• Visitá nuestra página principal</li>
                {showRetry && <li>• Intentá recargar la página</li>}
              </ul>
            </div>

            {/* Botones de acción */}
            <div className='flex flex-col sm:flex-row gap-3'>
              {/* Botón principal - Ir al inicio */}
              <Button asChild className='flex-1 bg-blaze-orange-600 hover:bg-blaze-orange-700'>
                <Link href='/'>
                  <Home className='w-4 h-4 mr-2' />
                  Ir al inicio
                </Link>
              </Button>

              {/* Botón secundario - Volver */}
              {showGoBack && (
                <Button variant='outline' onClick={handleGoBack} className='flex-1'>
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Volver
                </Button>
              )}

              {/* Botón de retry */}
              {showRetry && (
                <Button variant='outline' onClick={handleRetry} className='flex-1'>
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Reintentar
                </Button>
              )}
            </div>

            {/* Enlaces útiles */}
            <div className='border-t pt-4'>
              <p className='text-sm text-gray-500 mb-3'>Enlaces útiles:</p>
              <div className='flex flex-wrap justify-center gap-4 text-sm'>
                <Link
                  href='/shop'
                  className='text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors'
                >
                  Tienda
                </Link>
                <Link
                  href='/contact'
                  className='text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors'
                >
                  Contacto
                </Link>
                <Link
                  href='/help'
                  className='text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors'
                >
                  Ayuda
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-500'>
            Si el problema persiste, podés{' '}
            <Link
              href='/contact'
              className='text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors'
            >
              contactarnos
            </Link>{' '}
            para obtener ayuda.
          </p>
        </div>
      </div>
    </div>
  )
}

// ===================================
// COMPONENTES ESPECIALIZADOS
// ===================================

const Error404: React.FC<Omit<ErrorPageProps, 'errorCode'>> = props => (
  <ErrorPage {...props} errorCode='404' />
)

const Error500: React.FC<Omit<ErrorPageProps, 'errorCode'>> = props => (
  <ErrorPage {...props} errorCode='500' showRetry />
)

const Error403: React.FC<Omit<ErrorPageProps, 'errorCode'>> = props => (
  <ErrorPage {...props} errorCode='403' />
)

// ===================================
// EXPORTS
// ===================================

export type { ErrorPageProps }
export { Error404, Error500, Error403 }
export default ErrorPage
