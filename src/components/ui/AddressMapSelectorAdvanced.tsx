'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, CheckCircle, AlertCircle, Loader2, X, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface AddressMapSelectorAdvancedProps {
  value?: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  onValidationChange?: (isValid: boolean, error?: string) => void
  className?: string
  disabled?: boolean
  required?: boolean
  apiKey?: string
  label?: string
  error?: string
  showDevButtons?: boolean
}

export function AddressMapSelectorAdvanced({
  value = '',
  onChange,
  onValidationChange,
  className,
  disabled = false,
  required = false,
  apiKey,
  label = 'Selecciona tu ubicación',
  error,
  showDevButtons = false
}: AddressMapSelectorAdvancedProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(value)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(error)
  const [showMap, setShowMap] = useState(false)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'DEMO_KEY'

  // Límites de Córdoba Capital (más estrictos)
  const cordobaCapitalBounds = {
    north: -31.25,
    south: -31.55,
    east: -64.05,
    west: -64.35
  }

  // Cargar Google Maps API
  useEffect(() => {
    if (!finalApiKey || finalApiKey === 'DEMO_KEY') {
      console.warn('Google Maps API key no configurada. Usando modo demo.')
      return
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
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
        setErrorMessage('Error cargando el mapa. Verifica la configuración de la API key.')
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [finalApiKey])

  // Inicializar autocompletado
  useEffect(() => {
    if (!isMapLoaded || !inputRef.current || finalApiKey === 'DEMO_KEY') return

    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        setTimeout(initAutocomplete, 100)
        return
      }

      const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current!, {
        componentRestrictions: { country: 'ar' }, // Solo Argentina
        fields: ['formatted_address', 'geometry', 'address_components'],
        types: ['address']
      })

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace()
        
        if (!place.geometry || !place.geometry.location) {
          setErrorMessage('No se pudo encontrar la ubicación')
          setIsValid(false)
          onValidationChange?.(false, 'No se pudo encontrar la ubicación')
          return
        }

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address || ''

        // Verificar si está en Córdoba Capital
        const isInCordobaCapital = isWithinCordobaCapitalBounds(lat, lng) && 
          isCordobaCapitalAddress(place.address_components || [])

        setSelectedAddress(address)
        setSelectedCoordinates({ lat, lng })
        setIsValid(isInCordobaCapital)
        setErrorMessage(isInCordobaCapital ? undefined : 'La dirección debe estar en Córdoba Capital')
        onValidationChange?.(isInCordobaCapital, isInCordobaCapital ? undefined : 'La dirección debe estar en Córdoba Capital')
        onChange(address, { lat, lng })

        // Centrar el mapa si está visible
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng })
          mapInstanceRef.current.setZoom(15)
        }
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng })
        }
      })

      setAutocomplete(autocompleteInstance)
    }

    initAutocomplete()
  }, [isMapLoaded, onChange, onValidationChange, finalApiKey])

  // Verificar si está dentro de los límites de Córdoba Capital
  const isWithinCordobaCapitalBounds = (lat: number, lng: number): boolean => {
    return (
      lat >= cordobaCapitalBounds.south &&
      lat <= cordobaCapitalBounds.north &&
      lng >= cordobaCapitalBounds.west &&
      lng <= cordobaCapitalBounds.east
    )
  }

  // Verificar si la dirección es de Córdoba Capital basándose en los componentes
  const isCordobaCapitalAddress = (addressComponents: google.maps.GeocoderAddressComponent[]): boolean => {
    const locality = addressComponents.find(component => 
      component.types.includes('locality')
    )
    const administrativeAreaLevel1 = addressComponents.find(component => 
      component.types.includes('administrative_area_level_1')
    )

    return (
      locality?.long_name === 'Córdoba' &&
      administrativeAreaLevel1?.long_name === 'Córdoba'
    )
  }

  // Inicializar mapa
  useEffect(() => {
    if (!showMap || !mapRef.current) return

    const initMap = () => {
      if (!window.google || !window.google.maps) {
        setTimeout(initMap, 100)
        return
      }

      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: -31.4201, lng: -64.1888 },
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        restriction: {
          latLngBounds: {
            north: cordobaCapitalBounds.north,
            south: cordobaCapitalBounds.south,
            east: cordobaCapitalBounds.east,
            west: cordobaCapitalBounds.west
          },
          strictBounds: false
        }
      })

      mapInstanceRef.current = map
      geocoderRef.current = new google.maps.Geocoder()

      // Crear marcador
      const marker = new google.maps.Marker({
        position: { lat: -31.4201, lng: -64.1888 },
        map: map,
        draggable: true,
        title: 'Arrastra para seleccionar tu ubicación'
      })

      markerRef.current = marker

      // Evento de arrastre del marcador
      marker.addListener('dragend', () => {
        const position = marker.getPosition()
        if (position) {
          const lat = position.lat()
          const lng = position.lng()
          setSelectedCoordinates({ lat, lng })
          reverseGeocode(lat, lng)
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

    setTimeout(initMap, 100)
  }, [showMap])

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
          const addressComponents = results[0].address_components || []
          
          setSelectedAddress(address)
          
          // Verificar si está en Córdoba Capital
          const isInCordobaCapital = isWithinCordobaCapitalBounds(lat, lng) && 
            isCordobaCapitalAddress(addressComponents)
          
          setIsValid(isInCordobaCapital)
          setErrorMessage(isInCordobaCapital ? undefined : 'La dirección debe estar en Córdoba Capital')
          onValidationChange?.(isInCordobaCapital, isInCordobaCapital ? undefined : 'La dirección debe estar en Córdoba Capital')
          
          onChange(address, { lat, lng })
        } else {
          setErrorMessage('No se pudo obtener la dirección')
          setIsValid(false)
          onValidationChange?.(false, 'No se pudo obtener la dirección')
        }
      }
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
        
        // Centrar el mapa y mover el marcador
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng })
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng })
          mapInstanceRef.current.setZoom(15)
        }
        setSelectedCoordinates({ lat, lng })
        reverseGeocode(lat, lng)
        setIsLoading(false)
      },
      (error) => {
        console.debug('Error obteniendo ubicación:', error)
        
        let errorMessage = 'No se pudo obtener tu ubicación'
        
        switch (error.code) {
          case 1:
            errorMessage = 'Permisos de ubicación denegados. Puedes escribir tu dirección manualmente.'
            break
          case 2:
            errorMessage = 'Ubicación no disponible. Puedes escribir tu dirección manualmente.'
            break
          case 3:
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
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
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

  const handleDismissError = () => {
    setErrorMessage(undefined)
    setIsValid(null)
    onValidationChange?.(false, undefined)
  }

  // Funciones de desarrollo
  const handleTestLocation = () => {
    const testLocation = { lat: -31.4201, lng: -64.1888 }
    const testAddress = 'Córdoba Capital, Córdoba, Argentina'
    
    setSelectedAddress(testAddress)
    setSelectedCoordinates(testLocation)
    setIsValid(true)
    setErrorMessage(undefined)
    onChange(testAddress, testLocation)
    onValidationChange?.(true, undefined)
  }

  const handleFallbackLocation = () => {
    const cordobaCenter = { lat: -31.4201, lng: -64.1888 }
    const fallbackAddress = 'Córdoba Capital, Córdoba, Argentina'
    
    if (markerRef.current) {
      markerRef.current.setPosition(cordobaCenter)
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(cordobaCenter)
      mapInstanceRef.current.setZoom(13)
    }
    
    setSelectedCoordinates(cordobaCenter)
    setSelectedAddress(fallbackAddress)
    setIsValid(true)
    setErrorMessage(undefined)
    onChange(fallbackAddress, cordobaCenter)
    onValidationChange?.(true, undefined)
  }

  // Validación manual para modo demo
  const handleManualInput = (inputValue: string) => {
    setSelectedAddress(inputValue)
    
    if (inputValue.trim()) {
      // Validación simple para modo demo
      const isManualAddress = inputValue.toLowerCase().includes('córdoba') || 
                            inputValue.toLowerCase().includes('cordoba')
      setIsValid(isManualAddress)
      setErrorMessage(isManualAddress ? undefined : 'La dirección debe estar en Córdoba Capital')
      onValidationChange?.(isManualAddress, isManualAddress ? undefined : 'La dirección debe estar en Córdoba Capital')
      onChange(inputValue, selectedCoordinates || undefined)
    } else {
      setIsValid(null)
      setErrorMessage(undefined)
      onValidationChange?.(false, undefined)
    }
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

      {/* Input de dirección con autocompletado */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedAddress}
          onChange={(e) => {
            if (finalApiKey === 'DEMO_KEY') {
              handleManualInput(e.target.value)
            } else {
              setSelectedAddress(e.target.value)
            }
          }}
          placeholder={finalApiKey === 'DEMO_KEY' 
            ? "Escribe tu dirección en Córdoba Capital (modo demo)" 
            : "Escribe tu dirección en Córdoba Capital"
          }
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
            <p className="text-xs text-gray-500">
              💡 <strong>Alternativa:</strong> Puedes seleccionar tu ubicación manualmente en el mapa.
            </p>
          )}
        </div>
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

      {/* Botones de desarrollo - Solo mostrar si showDevButtons es true */}
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
              <li>Solo se permiten ubicaciones en Córdoba Capital</li>
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

      {/* Mensaje de modo demo */}
      {finalApiKey === 'DEMO_KEY' && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          ⚠️ <strong>Modo Demo:</strong> Google Maps API no configurada. La validación es básica.
        </div>
      )}
    </div>
  )
}
