'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, CheckCircle, AlertCircle, Loader2, X, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface AddressMapSelectorProps {
  value?: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  onValidationChange?: (isValid: boolean, error?: string) => void
  className?: string
  disabled?: boolean
  required?: boolean
  apiKey?: string
  label?: string
  error?: string
  showDevButtons?: boolean // Nueva prop para mostrar botones de desarrollo
}

export function AddressMapSelector({
  value = '',
  onChange,
  onValidationChange,
  className,
  disabled = false,
  required = false,
  apiKey,
  label = 'Selecciona tu ubicación',
  error,
  showDevButtons = false // Por defecto no mostrar botones de desarrollo
}: AddressMapSelectorProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(value)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(error)
  const [showMap, setShowMap] = useState(false)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Límites de Córdoba Capital
  const cordobaBounds = {
    north: -31.25,
    south: -31.55,
    east: -64.05,
    west: -64.35
  }

  // Cargar Google Maps API
  useEffect(() => {
    if (!finalApiKey) return

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${finalApiKey}&libraries=places&language=es&region=ar`
      script.async = true
      script.defer = true
      script.onload = () => setIsMapLoaded(true)
      script.onerror = () => {
        console.error('Error cargando Google Maps API')
        setErrorMessage('Error cargando el mapa')
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [finalApiKey])

  // Inicializar mapa
  useEffect(() => {
    if (!showMap || !mapRef.current) return

    const initMap = () => {
      // Verificar si Google Maps está disponible
      if (!window.google || !window.google.maps) {
        console.warn('Google Maps no está disponible, reintentando...')
        setTimeout(initMap, 1000)
        return
      }

      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: -31.4201, lng: -64.1888 }, // Centro de Córdoba
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        restriction: {
          latLngBounds: {
            north: cordobaBounds.north,
            south: cordobaBounds.south,
            east: cordobaBounds.east,
            west: cordobaBounds.west
          },
          strictBounds: false
        },
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map
      geocoderRef.current = new google.maps.Geocoder()

      // Crear marcador inicial
      const marker = new google.maps.Marker({
        position: { lat: -31.4201, lng: -64.1888 },
        map: map,
        draggable: true,
        title: 'Arrastra para seleccionar tu ubicación',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#FFFFFF" stroke-width="4"/>
              <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }
      })

      markerRef.current = marker

      // Evento de arrastre del marcador
      marker.addListener('dragend', () => {
        const position = marker.getPosition()
        if (position) {
          setSelectedCoordinates({
            lat: position.lat(),
            lng: position.lng()
          })
          reverseGeocode(position.lat(), position.lng())
        }
      })

      // Evento de click en el mapa
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat()
          const lng = event.latLng.lng()
          marker.setPosition({ lat, lng })
          setSelectedCoordinates({ lat, lng })
          reverseGeocode(lat, lng)
        }
      })
    }

    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(initMap, 100)
  }, [showMap])

  // Geocodificación inversa
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      // Si no hay geocoder, usar dirección de fallback
      const fallbackAddress = 'Córdoba Capital, Córdoba, Argentina'
      setSelectedAddress(fallbackAddress)
      setIsValid(true)
      setErrorMessage(undefined)
      onChange(fallbackAddress, { lat, lng })
      onValidationChange?.(true, undefined)
      return
    }

    setIsLoading(true)
    setErrorMessage(undefined)

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        setIsLoading(false)
        
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address
          setSelectedAddress(address)
          
          // Verificar si está en la provincia de Córdoba (más amplio que solo Capital)
          const isInCordoba = address.toLowerCase().includes('córdoba') || 
                             address.toLowerCase().includes('cordoba')
          
          setIsValid(isInCordoba)
          setErrorMessage(isInCordoba ? undefined : 'La ubicación debe estar en la provincia de Córdoba')
          onValidationChange?.(isInCordoba, isInCordoba ? undefined : 'La ubicación debe estar en la provincia de Córdoba')
          
          onChange(address, { lat, lng })
        } else {
          // Si falla la geocodificación, usar dirección de fallback
          console.debug('Geocodificación falló, usando dirección de fallback')
          const fallbackAddress = 'Córdoba Capital, Córdoba, Argentina'
          setSelectedAddress(fallbackAddress)
          setIsValid(true)
          setErrorMessage(undefined)
          onChange(fallbackAddress, { lat, lng })
          onValidationChange?.(true, undefined)
        }
      }
    )
  }

  // Verificar si está dentro de los límites de Córdoba Capital
  const isWithinCordobaBounds = (lat: number, lng: number): boolean => {
    return (
      lat >= cordobaBounds.south &&
      lat <= cordobaBounds.north &&
      lng >= cordobaBounds.west &&
      lng <= cordobaBounds.east
    )
  }

  // Obtener ubicación actual del usuario
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocalización no soportada por este navegador')
      return
    }

    setIsLoading(true)
    setErrorMessage(undefined)

    // Configuración más permisiva para desarrollo
    const options = {
      enableHighAccuracy: false, // Menos estricto para desarrollo
      timeout: 10000,
      maximumAge: 60000 // 1 minuto de cache
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        console.debug('Ubicación obtenida:', { lat, lng })
        
        // Centrar el mapa y mover el marcador independientemente de la ubicación
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng })
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng })
          mapInstanceRef.current.setZoom(12) // zoom apropiado para ver la ubicación
        }
        setSelectedCoordinates({ lat, lng })
        reverseGeocode(lat, lng)

        // Verificar si está en Córdoba Capital y mostrar advertencia si no
        if (!isWithinCordobaBounds(lat, lng)) {
          setErrorMessage('Tu ubicación está fuera de Córdoba Capital. Mueve el marcador a tu dirección de entrega en Córdoba')
          setIsValid(false)
          onValidationChange?.(false, 'Ubicación fuera de zona de entrega')
        } else {
          setErrorMessage(undefined)
          // La validación la maneja reverseGeocode cuando está en Córdoba
        }
        setIsLoading(false)
      },
      (error) => {
        console.debug('Error obteniendo ubicación:', error)
        
        let errorMessage = 'No se pudo obtener tu ubicación'
        
        // Mensajes más específicos según el tipo de error
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Permisos de ubicación denegados. Puedes escribir tu dirección manualmente.'
            break
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Ubicación no disponible. Puedes escribir tu dirección manualmente.'
            break
          case 3: // TIMEOUT
            errorMessage = 'Tiempo de espera agotado. Puedes escribir tu dirección manualmente.'
            break
          default:
            errorMessage = 'Error al obtener ubicación. Puedes escribir tu dirección manualmente.'
            break
        }
        
        setErrorMessage(errorMessage)
        setIsValid(false)
        onValidationChange?.(false, errorMessage)
        setIsLoading(false)
      },
      options
    )
  }

  const handleToggleMap = () => {
    setShowMap(!showMap)
  }

  const handleClear = () => {
    setSelectedAddress('')
    setSelectedCoordinates(null)
    setIsValid(null)
    setErrorMessage(undefined)
    onChange('')
    onValidationChange?.(false, undefined)
  }

  const handleDismissError = () => {
    setErrorMessage(undefined)
    setIsValid(null)
    onValidationChange?.(false, undefined)
  }

  const handleFallbackLocation = () => {
    // Centrar en Córdoba como fallback
    const cordobaCenter = { lat: -31.4201, lng: -64.1888 }
    
    console.debug('Usando ubicación de fallback:', cordobaCenter)
    
    if (markerRef.current) {
      markerRef.current.setPosition(cordobaCenter)
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(cordobaCenter)
      mapInstanceRef.current.setZoom(13)
    }
    
    setSelectedCoordinates(cordobaCenter)
    setErrorMessage(undefined)
    setIsValid(null) // Reset validation state
    
    // Usar dirección de fallback directamente
    const fallbackAddress = 'Córdoba Capital, Córdoba, Argentina'
    setSelectedAddress(fallbackAddress)
    setIsValid(true)
    onChange(fallbackAddress, cordobaCenter)
    onValidationChange?.(true, undefined)
  }

  const handleTestLocation = () => {
    // Simular ubicación GPS para testing
    const testLocation = { lat: -31.4201, lng: -64.1888 }
    
    console.debug('Usando ubicación de prueba:', testLocation)
    
    if (markerRef.current) {
      markerRef.current.setPosition(testLocation)
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(testLocation)
      mapInstanceRef.current.setZoom(12)
    }
    
    setSelectedCoordinates(testLocation)
    setErrorMessage(undefined)
    setIsValid(null) // Reset validation state
    
    // Usar dirección de prueba directamente
    const testAddress = 'Córdoba Capital, Córdoba, Argentina'
    setSelectedAddress(testAddress)
    setIsValid(true)
    onChange(testAddress, testLocation)
    onValidationChange?.(true, undefined)
  }

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input de dirección */}
      <div className="relative">
        <input
          type="text"
          value={selectedAddress}
          onChange={(e) => {
            setSelectedAddress(e.target.value)
            // Si el usuario escribe manualmente, validar la dirección
            if (e.target.value.trim()) {
              // Validar que contenga Córdoba (provincia completa)
              const isManualAddress = e.target.value.toLowerCase().includes('córdoba') || 
                                    e.target.value.toLowerCase().includes('cordoba')
              setIsValid(isManualAddress)
              setErrorMessage(isManualAddress ? undefined : 'La ubicación debe estar en la provincia de Córdoba')
              onValidationChange?.(isManualAddress, isManualAddress ? undefined : 'La ubicación debe estar en la provincia de Córdoba')
              onChange(e.target.value, selectedCoordinates)
            }
          }}
          placeholder="Escribe tu dirección o selecciona en el mapa"
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 pr-20 text-base border rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            {
              'border-red-500 focus:border-red-500': errorMessage || error,
              'border-green-500 focus:border-green-600': isValid,
              'border-gray-300 focus:border-blue-500': !errorMessage && !isValid,
              'bg-gray-50 cursor-not-allowed': disabled,
            },
            className
          )}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {isLoading && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
          )}
          {!isLoading && isValid && (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          )}
          {!isLoading && errorMessage && (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          )}
          {selectedAddress && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mensajes de estado */}
      {errorMessage && (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-red-600 flex items-center gap-1 flex-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={handleDismissError}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              title="Descartar error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {errorMessage.includes('ubicación') && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                💡 <strong>Alternativa:</strong> Puedes seleccionar tu ubicación manualmente en el mapa o usar las direcciones de prueba.
              </p>
              <button
                type="button"
                onClick={handleFallbackLocation}
                className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                📍 Centrar en Córdoba Capital
              </button>
            </div>
          )}
        </div>
      )}

      {isValid && !errorMessage && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Ubicación válida en la provincia de Córdoba
        </p>
      )}

      {/* Botones de control */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleToggleMap}
          disabled={disabled}
          className="flex-1"
        >
          {showMap ? 'Ocultar Mapa' : 'Mostrar Mapa'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={disabled || isLoading}
          className="flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          Mi Ubicación
        </Button>
      </div>

      {/* Botones de fallback para desarrollo - Solo mostrar si showDevButtons es true */}
      {showDevButtons && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestLocation}
            disabled={disabled}
            className="flex-1 text-sm"
          >
            🧪 Ubicación de Prueba
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={handleFallbackLocation}
            disabled={disabled}
            className="flex-1 text-sm"
          >
            📍 Centrar en Córdoba
          </Button>
        </div>
      )}

      {/* Mapa */}
      {showMap && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <p>🗺️ <strong>Instrucciones:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Arrastra el marcador azul a tu domicilio</li>
              <li>O haz clic en el mapa para seleccionar una ubicación</li>
              <li>Se recomienda ubicaciones en la provincia de Córdoba para entrega</li>
            </ul>
          </div>
          
          <div 
            ref={mapRef}
            data-testid="map-container"
            className="w-full h-96 border border-gray-300 rounded-lg"
            style={{ minHeight: '384px' }}
          />
        </div>
      )}

      {/* Información adicional */}
      {selectedCoordinates && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Coordenadas:</strong> {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
        </div>
      )}
    </div>
  )
}
