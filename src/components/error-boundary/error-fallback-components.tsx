'use client'

// ===================================
// ERROR FALLBACK COMPONENTS
// ===================================
// Componentes de fallback especializados para diferentes tipos de errores

import React from 'react'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ShoppingCart,
  Search,
  User,
  Wifi,
  Package,
} from '@/lib/optimized-imports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ===================================
// INTERFACES
// ===================================

interface ErrorFallbackProps {
  error?: Error
  onRetry?: () => void
  onGoHome?: () => void
  className?: string
}

// ===================================
// FALLBACK GENÉRICO
// ===================================

export const GenericErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  onGoHome,
  className = '',
}) => (
  <div className={`p-6 text-center ${className}`}>
    <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
    <h3 className='text-lg font-semibold text-gray-900 mb-2'>Algo salió mal</h3>
    <p className='text-gray-600 mb-4'>
      Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
    </p>
    <div className='flex gap-2 justify-center'>
      {onRetry && (
        <Button onClick={onRetry} size='sm'>
          <RefreshCw className='w-4 h-4 mr-2' />
          Reintentar
        </Button>
      )}
      {onGoHome && (
        <Button onClick={onGoHome} variant='outline' size='sm'>
          <Home className='w-4 h-4 mr-2' />
          Inicio
        </Button>
      )}
    </div>
  </div>
)

// ===================================
// FALLBACK PARA PRODUCTOS
// ===================================

export const ProductErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  onGoHome,
  className = '',
}) => (
  <Card className={`w-full ${className}`}>
    <CardContent className='p-6 text-center'>
      <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
      <CardTitle className='text-lg mb-2'>Error cargando productos</CardTitle>
      <CardDescription className='mb-4'>
        No pudimos cargar los productos en este momento. Verifica tu conexión e intenta nuevamente.
      </CardDescription>
      <div className='flex gap-2 justify-center'>
        {onRetry && (
          <Button onClick={onRetry} size='sm'>
            <RefreshCw className='w-4 h-4 mr-2' />
            Reintentar
          </Button>
        )}
        <Button onClick={onGoHome} variant='outline' size='sm'>
          <Home className='w-4 h-4 mr-2' />
          Ver todos los productos
        </Button>
      </div>
    </CardContent>
  </Card>
)

// ===================================
// FALLBACK PARA CARRITO
// ===================================

export const CartErrorFallback: React.FC<ErrorFallbackProps> = ({ onRetry, className = '' }) => (
  <Alert className={`${className}`}>
    <ShoppingCart className='h-4 w-4' />
    <AlertDescription className='flex items-center justify-between'>
      <span>Error cargando el carrito. Los productos pueden no estar actualizados.</span>
      {onRetry && (
        <Button onClick={onRetry} size='sm' variant='outline'>
          <RefreshCw className='w-3 h-3 mr-1' />
          Actualizar
        </Button>
      )}
    </AlertDescription>
  </Alert>
)

// ===================================
// FALLBACK PARA BÚSQUEDA
// ===================================

export const SearchErrorFallback: React.FC<ErrorFallbackProps> = ({ onRetry, className = '' }) => (
  <div className={`p-8 text-center ${className}`}>
    <Search className='w-16 h-16 text-gray-400 mx-auto mb-4' />
    <h3 className='text-lg font-semibold text-gray-900 mb-2'>Error en la búsqueda</h3>
    <p className='text-gray-600 mb-4'>
      No pudimos procesar tu búsqueda. Por favor, intenta con otros términos.
    </p>
    {onRetry && (
      <Button onClick={onRetry} size='sm'>
        <RefreshCw className='w-4 h-4 mr-2' />
        Buscar de nuevo
      </Button>
    )}
  </div>
)

// ===================================
// FALLBACK PARA PERFIL DE USUARIO
// ===================================

export const UserProfileErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  onGoHome,
  className = '',
}) => (
  <Card className={`w-full max-w-md mx-auto ${className}`}>
    <CardHeader className='text-center'>
      <User className='w-12 h-12 text-gray-400 mx-auto mb-2' />
      <CardTitle>Error cargando perfil</CardTitle>
      <CardDescription>No pudimos cargar la información de tu perfil.</CardDescription>
    </CardHeader>
    <CardContent className='text-center space-y-2'>
      {onRetry && (
        <Button onClick={onRetry} className='w-full' size='sm'>
          <RefreshCw className='w-4 h-4 mr-2' />
          Reintentar
        </Button>
      )}
      {onGoHome && (
        <Button onClick={onGoHome} variant='outline' className='w-full' size='sm'>
          <Home className='w-4 h-4 mr-2' />
          Ir al inicio
        </Button>
      )}
    </CardContent>
  </Card>
)

// ===================================
// FALLBACK PARA ERRORES DE RED
// ===================================

export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({ onRetry, className = '' }) => (
  <div className={`p-6 text-center ${className}`}>
    <Wifi className='w-16 h-16 text-gray-400 mx-auto mb-4' />
    <h3 className='text-lg font-semibold text-gray-900 mb-2'>Sin conexión</h3>
    <p className='text-gray-600 mb-4'>Verifica tu conexión a internet e intenta nuevamente.</p>
    {onRetry && (
      <Button onClick={onRetry} size='sm'>
        <RefreshCw className='w-4 h-4 mr-2' />
        Reintentar
      </Button>
    )}
  </div>
)

// ===================================
// FALLBACK PARA CHUNK LOADING
// ===================================

export const ChunkLoadErrorFallback: React.FC<ErrorFallbackProps> = ({ className = '' }) => (
  <div className={`p-6 text-center ${className}`}>
    <Package className='w-16 h-16 text-blue-500 mx-auto mb-4' />
    <h3 className='text-lg font-semibold text-gray-900 mb-2'>Actualizando aplicación</h3>
    <p className='text-gray-600 mb-4'>
      Estamos cargando la última versión. La página se recargará automáticamente.
    </p>
    <div className='flex justify-center'>
      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
    </div>
  </div>
)

// ===================================
// FALLBACK COMPACTO
// ===================================

export const CompactErrorFallback: React.FC<ErrorFallbackProps> = ({ onRetry, className = '' }) => (
  <div
    className={`flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded ${className}`}
  >
    <AlertTriangle className='w-4 h-4 text-red-600 flex-shrink-0' />
    <span className='text-sm text-red-700 flex-grow'>Error cargando contenido</span>
    {onRetry && (
      <Button onClick={onRetry} size='sm' variant='outline' className='h-6 px-2'>
        <RefreshCw className='w-3 h-3' />
      </Button>
    )}
  </div>
)

// ===================================
// FALLBACK PARA PÁGINAS COMPLETAS
// ===================================

export const PageErrorFallback: React.FC<
  ErrorFallbackProps & {
    title?: string
    description?: string
    showContactSupport?: boolean
  }
> = ({
  error,
  onRetry,
  onGoHome,
  title = '¡Oops! Algo salió mal',
  description = 'Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.',
  showContactSupport = true,
  className = '',
}) => (
  <div className={`min-h-screen flex items-center justify-center bg-gray-50 px-4 ${className}`}>
    <Card className='w-full max-w-lg'>
      <CardHeader className='text-center'>
        <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
          <AlertTriangle className='w-8 h-8 text-red-600' />
        </div>
        <CardTitle className='text-2xl'>{title}</CardTitle>
        <CardDescription className='text-base'>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {process.env.NODE_ENV === 'development' && error && (
          <Alert>
            <AlertDescription className='text-xs font-mono'>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className='flex flex-col gap-2'>
          {onRetry && (
            <Button onClick={onRetry} className='w-full'>
              <RefreshCw className='w-4 h-4 mr-2' />
              Intentar de nuevo
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant='outline' className='w-full'>
              <Home className='w-4 h-4 mr-2' />
              Ir al inicio
            </Button>
          )}
          <Button variant='outline' className='w-full' onClick={() => window.location.reload()}>
            <RefreshCw className='w-4 h-4 mr-2' />
            Recargar página
          </Button>
        </div>

        {showContactSupport && (
          <div className='text-center pt-4 border-t'>
            <p className='text-sm text-gray-600 mb-2'>¿El problema persiste?</p>
            <Button
              variant='link'
              size='sm'
              onClick={() => {
                const subject = 'Reporte de Error - Pinteya'
                const body = `Descripción del problema:\n\nURL: ${window.location.href}\nFecha: ${new Date().toISOString()}`
                window.open(
                  `mailto:soporte@pinteya.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                )
              }}
            >
              Contactar soporte
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)

// ===================================
// FACTORY FUNCTION
// ===================================

export const createErrorFallback = (type: string) => {
  switch (type) {
    case 'product':
    case 'products':
      return ProductErrorFallback
    case 'cart':
      return CartErrorFallback
    case 'search':
      return SearchErrorFallback
    case 'user':
    case 'profile':
      return UserProfileErrorFallback
    case 'network':
      return NetworkErrorFallback
    case 'chunk':
      return ChunkLoadErrorFallback
    case 'compact':
      return CompactErrorFallback
    case 'page':
      return PageErrorFallback
    default:
      return GenericErrorFallback
  }
}
