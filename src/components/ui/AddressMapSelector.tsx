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
  error
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

  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBBDvjcC42QcHu7qlToPK4tTaV7EdvtJmc'

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
    if (!isMapLoaded || !mapRef.current || !showMap) return

    const initMap = () => {
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
  }, [isMapLoaded, showMap])

  // Geocodificación inversa
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return

    setIsLoading(true)
    setErrorMessage(undefined)

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        setIsLoading(false)
        
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address
          setSelectedAddress(address)
          
          // Verificar si está en Córdoba Capital
          const isInCordoba = isWithinCordobaBounds(lat, lng) && 
            address.toLowerCase().includes('córdoba')
          
          setIsValid(isInCordoba)
          setErrorMessage(isInCordoba ? undefined : 'La ubicación debe estar en Córdoba Capital')
          onValidationChange?.(isInCordoba, isInCordoba ? undefined : 'La ubicación debe estar en Córdoba Capital')
          
          onChange(address, { lat, lng })
        } else {
          setErrorMessage('No se pudo obtener la dirección')
          setIsValid(false)
          onValidationChange?.(false, 'No se pudo obtener la dirección')
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        // Verificar si está en Córdoba Capital
        if (isWithinCordobaBounds(lat, lng)) {
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng })
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng })
          }
          setSelectedCoordinates({ lat, lng })
          reverseGeocode(lat, lng)
        } else {
          setErrorMessage('Tu ubicación actual no está en Córdoba Capital')
          setIsValid(false)
          onValidationChange?.(false, 'Tu ubicación actual no está en Córdoba Capital')
        }
        setIsLoading(false)
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error)
        setErrorMessage('No se pudo obtener tu ubicación')
        setIsValid(false)
        onValidationChange?.(false, 'No se pudo obtener tu ubicación')
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
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
          onChange={(e) => setSelectedAddress(e.target.value)}
          placeholder="Selecciona tu ubicación en el mapa"
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
          readOnly
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
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </p>
      )}

      {isValid && !errorMessage && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Ubicación válida en Córdoba Capital
        </p>
      )}

      {/* Botones de control */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleToggleMap}
          disabled={disabled || !isMapLoaded}
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

      {/* Mapa */}
      {showMap && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <p>🗺️ <strong>Instrucciones:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Arrastra el marcador azul a tu domicilio</li>
              <li>O haz clic en el mapa para seleccionar una ubicación</li>
              <li>Solo se permiten ubicaciones en Córdoba Capital</li>
            </ul>
          </div>
          
          <div 
            ref={mapRef}
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
