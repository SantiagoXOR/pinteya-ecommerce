'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Phone, MapPin, ChevronDown, Navigation, Loader2 } from '@/lib/optimized-imports'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useTenantSafe } from '@/contexts/TenantContext'

const TopBar = () => {
  const tenant = useTenantSafe()
  const {
    detectedZone,
    isLoading,
    error,
    permissionStatus,
    requestLocation,
    selectZone,
    deliveryZones,
  } = useGeolocation()
  
  // Obtener teléfono de contacto del tenant
  const contactPhone = tenant?.contactPhone || tenant?.whatsappNumber || '5493513411796'
  // Formatear número para mostrar
  const displayPhone = contactPhone.replace(/^549(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')
  const telLink = `tel:+${contactPhone}`

  // Zona actual: detectada automáticamente o Córdoba Capital por defecto
  const currentZone = detectedZone || deliveryZones.find(zone => zone.id === 'cordoba-capital')

  return (
    <div 
      className='text-white hidden lg:block topbar-slide relative z-topbar transition-all duration-300'
      style={{ 
        backgroundColor: tenant?.headerBgColor || 'var(--tenant-header-bg)',
        borderBottomColor: tenant?.primaryDark || 'var(--tenant-primary-dark)',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid'
      }}
    >
      <div className='max-w-[1170px] mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between py-2'>
          {/* Información de contacto - Izquierda */}
          <div className='flex items-center gap-6'>
            {/* Teléfono clickeable - Dinámico por tenant */}
            <Link
              href={telLink}
              className='flex items-center gap-2 hover:text-accent-200 transition-all duration-200 hover:scale-105 group focus-ring'
            >
              <Phone className='w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12' />
              <span className='text-sm font-medium transition-colors duration-200'>
                {displayPhone}
              </span>
            </Link>

            {/* Separador */}
            <span className='w-px h-4 bg-accent-500'></span>

            {/* Asesoramiento 24/7 */}
            <div className='flex items-center gap-2 transition-all duration-200 hover:scale-105'>
              <div className='w-2 h-2 bg-fun-green-400 rounded-full animate-pulse hover:animate-bounce'></div>
              <span className='text-sm font-medium transition-colors duration-200 hover:text-fun-green-200'>
                Asesoramiento 24/7
              </span>
            </div>

            {/* Separador */}
            <span className='w-px h-4 bg-accent-500'></span>

            {/* Indicador de ubicación mejorado */}
            {detectedZone && (
              <div className='flex items-center gap-2 max-w-48 overflow-hidden'>
                <MapPin className='w-4 h-4 text-fun-green-400 flex-shrink-0' />
                <div className='overflow-hidden'>
                  <div className='text-sm font-medium whitespace-nowrap animate-marquee'>
                    Ubicación detectada: {detectedZone.name}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zona de entrega con geolocalización - Derecha */}
          <div className='flex items-center gap-4'>
            {/* Selector de zona de entrega con geolocalización */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-white hover:text-accent-200 hover:bg-accent-700 gap-2 px-3 py-1 transition-all duration-200 hover:scale-105 group focus-ring'
                  aria-expanded='false'
                  aria-haspopup='menu'
                  data-testid='delivery-zone-selector'
                >
                  {isLoading ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <MapPin className='w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:text-fun-green-300' />
                  )}
                  <span className='text-sm transition-colors duration-200'>
                    Envíos en {currentZone?.name || 'Seleccionar zona'}
                  </span>
                  <ChevronDown className='w-3 h-3 transition-transform duration-200 group-hover:rotate-180' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-64 search-suggestions-fade'
                data-testid='delivery-zone-dropdown'
              >
                {/* Opción de geolocalización */}
                {permissionStatus !== 'granted' && !detectedZone && (
                  <>
                    <DropdownMenuItem
                      onClick={requestLocation}
                      className='flex items-center gap-2 py-3 text-primary-600 hover:text-primary-700 dropdown-item-hover transition-all duration-200 hover:scale-105 group'
                    >
                      <Navigation className='w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12' />
                      <div className='flex flex-col'>
                        <span className='font-medium transition-colors duration-200'>
                          Detectar mi ubicación
                        </span>
                        <span className='text-xs text-gray-500 transition-colors duration-200'>
                          Para mostrar la zona más cercana
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Estado de geolocalización */}
                {detectedZone && (
                  <>
                    <div className='px-3 py-2 bg-fun-green-50 border-l-2 border-fun-green-400'>
                      <div className='flex items-center gap-2 text-fun-green-700'>
                        <Navigation className='w-3 h-3' />
                        <span className='text-xs font-medium'>Ubicación detectada</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Error de geolocalización */}
                {error && (
                  <>
                    <div className='px-3 py-2 text-xs text-gray-500'>
                      {error instanceof Error
                        ? error.message
                        : error?.toString() || 'Error desconocido'}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Lista de zonas */}
                {deliveryZones.map(zone => (
                  <DropdownMenuItem
                    key={zone.id}
                    onClick={() => selectZone(zone.id)}
                    className={`flex items-center justify-between py-2 ${
                      currentZone?.id === zone.id ? 'bg-accent-50' : ''
                    }`}
                    data-testid={`zone-${zone.id}`}
                  >
                    <span
                      className={`font-medium ${
                        currentZone?.id === zone.id ? 'text-accent-600' : ''
                      }`}
                    >
                      {zone.name}
                    </span>
                    {zone.available ? (
                      <span className='text-xs text-fun-green-600 font-medium'>Disponible</span>
                    ) : (
                      <span className='text-xs text-gray-400'>Próximamente</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
