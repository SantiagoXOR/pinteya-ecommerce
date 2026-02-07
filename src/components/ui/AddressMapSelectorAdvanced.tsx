'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, CheckCircle, AlertCircle, Loader2, X } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTenantSafe } from '@/contexts/TenantContext'
import {
  getTenantMapCenter,
  getTenantMapBounds,
  getTenantCityName,
  validateTenantAddress,
  isWithinTenantBounds,
} from '@/lib/tenant/tenant-location'

interface AddressMapSelectorAdvancedProps {
  value?: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  onValidationChange?: (isValid: boolean, error?: string) => void
  className?: string
  disabled?: boolean
  required?: boolean
  label?: string
  error?: string
}

export function AddressMapSelectorAdvanced({
  value = '',
  onChange,
  onValidationChange,
  className,
  disabled = false,
  required = false,
  label = 'Dirección de entrega',
  error
}: AddressMapSelectorAdvancedProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(value)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(error)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkLoadedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initMapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listenerRefs = useRef<google.maps.MapsEventListener[]>([])
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSearchedAddressRef = useRef<string>('')

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Obtener datos del tenant
  const tenant = useTenantSafe()
  const mapCenter = getTenantMapCenter(tenant)
  const mapBounds = getTenantMapBounds(tenant)
  const cityName = getTenantCityName(tenant)

  const finalApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'DEMO_KEY'

  const [placesApiAvailable, setPlacesApiAvailable] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  // Interceptar errores de Google Maps API para manejarlos silenciosamente
  useEffect(() => {
    const originalError = console.error
    let errorInterceptor: ((...args: any[]) => void) | null = null

    // Crear interceptor de errores
    errorInterceptor = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || ''
      const errorString = JSON.stringify(args)
      
      // Detectar errores de API key o restricciones
      if (errorMessage.includes('This API key is not authorized') ||
          errorMessage.includes('RefererNotAllowedMapError') ||
          errorMessage.includes('RefererNotAllowedError') ||
          errorMessage.includes('ApiTargetBlockedMapError') ||
          errorMessage.includes('not authorized to use this service') ||
          errorString.includes('RefererNotAllowed') ||
          errorString.includes('ApiTargetBlocked')) {
        if (isMountedRef.current) {
          setApiKeyError('La API key de Google Maps no está autorizada para este dominio. Verifica las restricciones en Google Cloud Console.')
          setIsMapLoaded(false)
          setPlacesApiAvailable(false)
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('[Google Maps] Error de autorización:', errorMessage)
        }
        return
      }
      if (errorMessage.includes('Places API') || errorString.includes('Places API')) {
        if (isMountedRef.current) setPlacesApiAvailable(false)
        if (process.env.NODE_ENV === 'development') {
          console.debug('Places API no disponible - error silenciado')
        }
        return
      }
      // Para otros errores, usar el handler original
      originalError.apply(console, args)
    }

    // Interceptar console.error
    console.error = errorInterceptor as typeof console.error

    // También interceptar errores globales de window
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event.message || ''
      const errorSource = event.filename || ''
      
      // Detectar errores de Google Maps
      if (errorSource.includes('maps.googleapis.com') ||
          errorMessage.includes('Google Maps') ||
          errorMessage.includes('RefererNotAllowed') ||
          errorMessage.includes('ApiTargetBlocked')) {
        if ((errorMessage.includes('RefererNotAllowed') || errorMessage.includes('ApiTargetBlocked')) && isMountedRef.current) {
          setApiKeyError('La API key de Google Maps no está autorizada para este dominio.')
          setIsMapLoaded(false)
        }
      }
    }

    window.addEventListener('error', handleGlobalError, true)

    return () => {
      // Restaurar el error original al desmontar
      if (errorInterceptor) {
        console.error = originalError
      }
      window.removeEventListener('error', handleGlobalError, true)
    }
  }, [])

  // Cargar Google Maps API con validación mejorada
  useEffect(() => {
    if (!finalApiKey || finalApiKey === 'DEMO_KEY') {
      setApiKeyError('Google Maps API key no configurada')
      return () => {}
    }
    if (finalApiKey.length < 20) {
      setApiKeyError('La API key de Google Maps parece inválida')
      return () => {}
    }

    const safeSet = (fn: () => void) => {
      if (isMountedRef.current) fn()
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        safeSet(() => {
          setIsMapLoaded(true)
          setPlacesApiAvailable(false)
        })
        return
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        let attempts = 0
        const maxAttempts = 50
        const checkLoaded = () => {
          if (!isMountedRef.current) return
          attempts++
          if (window.google && window.google.maps) {
            safeSet(() => {
              setIsMapLoaded(true)
              setPlacesApiAvailable(false)
            })
            return
          }
          if (attempts < maxAttempts) {
            const t = setTimeout(checkLoaded, 100)
            checkLoadedTimeoutRef.current = t
          } else {
            safeSet(() => {
              setApiKeyError('Timeout cargando Google Maps. Verifica tu conexión y la API key.')
              setIsMapLoaded(false)
            })
          }
        }
        checkLoaded()
        return
      }

      const script = document.createElement('script')
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${finalApiKey}&language=es&region=ar&loading=async`
      script.src = scriptUrl
      script.async = true
      script.defer = true

      const lt = setTimeout(() => {
        if (!isMountedRef.current) return
        if (!window.google || !window.google.maps) {
          safeSet(() => {
            setApiKeyError('Timeout cargando Google Maps. Verifica las restricciones de la API key en Google Cloud Console.')
            setIsMapLoaded(false)
          })
        }
      }, 30000)
      loadTimeoutRef.current = lt

      script.onload = () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
          loadTimeoutRef.current = null
        }
        if (!isMountedRef.current) return
        if (window.google && window.google.maps) {
          safeSet(() => {
            setIsMapLoaded(true)
            setPlacesApiAvailable(false)
            setApiKeyError(null)
          })
        } else {
          safeSet(() => {
            setApiKeyError('Error inicializando Google Maps')
            setIsMapLoaded(false)
          })
        }
      }
      script.onerror = () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
          loadTimeoutRef.current = null
        }
        if (!isMountedRef.current) return
        safeSet(() => {
          setApiKeyError('Error cargando Google Maps. Verifica la API key y las restricciones de dominio en Google Cloud Console.')
          setIsMapLoaded(false)
          setPlacesApiAvailable(false)
        })
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
      if (checkLoadedTimeoutRef.current) {
        clearTimeout(checkLoadedTimeoutRef.current)
        checkLoadedTimeoutRef.current = null
      }
    }
  }, [finalApiKey])

  // Verificar si está dentro de los límites del tenant (usando helper)
  const isWithinCordobaCapitalBounds = (lat: number, lng: number): boolean => {
    return isWithinTenantBounds(lat, lng, tenant)
  }

  // Inicializar mapa y autocomplete
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !inputRef.current) return

    const listeners: google.maps.MapsEventListener[] = []

    const initMap = () => {
      if (!isMountedRef.current) return
      if (!window.google || !window.google.maps) {
        const t = setTimeout(initMap, 100)
        initMapTimeoutRef.current = t
        return
      }
      if (!mapRef.current) return

      const map = new google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        restriction: {
          latLngBounds: { north: mapBounds.north, south: mapBounds.south, east: mapBounds.east, west: mapBounds.west },
          strictBounds: false
        }
      })
      mapInstanceRef.current = map
      geocoderRef.current = new google.maps.Geocoder()

      const marker = new google.maps.Marker({
        position: mapCenter,
        map,
        draggable: true,
        title: 'Arrastra para seleccionar tu ubicación'
      })
      markerRef.current = marker

      const onDragEnd = () => {
        if (!isMountedRef.current) return
        const position = marker.getPosition()
        if (position) {
          const lat = position.lat()
          const lng = position.lng()
          setSelectedCoordinates({ lat, lng })
          reverseGeocode(lat, lng)
        }
      }
      const dragListener = marker.addListener('dragend', onDragEnd)
      listeners.push(dragListener)

      const onClick = (event: google.maps.MapMouseEvent) => {
        if (!isMountedRef.current) return
        if (event.latLng) {
          const lat = event.latLng.lat()
          const lng = event.latLng.lng()
          marker.setPosition({ lat, lng })
          setSelectedCoordinates({ lat, lng })
          reverseGeocode(lat, lng)
        }
      }
      const clickListener = map.addListener('click', onClick)
      listeners.push(clickListener)
      listenerRefs.current = listeners
    }

    const t = setTimeout(initMap, 100)
    initMapTimeoutRef.current = t

    return () => {
      if (initMapTimeoutRef.current) {
        clearTimeout(initMapTimeoutRef.current)
        initMapTimeoutRef.current = null
      }
      listenerRefs.current.forEach((l) => l?.remove())
      listenerRefs.current = []
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      mapInstanceRef.current = null
      geocoderRef.current = null
    }
  }, [isMapLoaded, mapCenter, mapBounds])

  // Función de validación mejorada usando helper del tenant
  const validateLocation = (
    lat: number, 
    lng: number, 
    addressComponents: google.maps.GeocoderAddressComponent[],
    address: string
  ) => {
    const isInBounds = isWithinCordobaCapitalBounds(lat, lng)
    const isValidAddress = validateTenantAddress(address, addressComponents, tenant)
    
    const isValid = isInBounds && isValidAddress
    
    setIsValid(isValid)
    const errorMsg = isValid ? undefined : `La dirección debe estar en ${cityName}, Córdoba`
    setErrorMessage(errorMsg)
    onValidationChange?.(isValid, errorMsg)
    
    onChange(address, { lat, lng })
  }

  // Geocodificación inversa
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return

    setIsLoading(true)
    setErrorMessage(undefined)

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (!isMountedRef.current) return
        setIsLoading(false)
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address
          const addressComponents = results[0].address_components || []
          setSelectedAddress(address)
          validateLocation(lat, lng, addressComponents, address)
        } else {
          setErrorMessage('No se pudo obtener la dirección')
          setIsValid(false)
          onValidationChange?.(false, 'No se pudo obtener la dirección')
        }
      }
    )
  }

  // Buscar dirección escrita (geocodificación directa) - acepta dirección opcional para búsqueda automática
  const handleSearch = (addressToSearch?: string) => {
    const searchAddress = (addressToSearch ?? selectedAddress).trim()
    if (!searchAddress || !geocoderRef.current) return

    setIsSearching(true)
    setErrorMessage(undefined)

    geocoderRef.current.geocode(
      { address: `${searchAddress}, ${cityName}, Córdoba, Argentina` },
      (results, status) => {
        if (!isMountedRef.current) return
        setIsSearching(false)
        if (status === 'OK' && results && results[0]) {
          const result = results[0]
          const location = result.geometry.location
          const lat = location.lat()
          const lng = location.lng()
          if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setPosition({ lat, lng })
            mapInstanceRef.current.setCenter({ lat, lng })
            mapInstanceRef.current.setZoom(17)
          }
          
          setSelectedCoordinates({ lat, lng })
          setSelectedAddress(result.formatted_address)
          lastSearchedAddressRef.current = result.formatted_address
          
          // Validar ubicación
          validateLocation(lat, lng, result.address_components || [], result.formatted_address)
        } else {
          setErrorMessage('No encontramos la dirección ingresada; podés probar actualizando tu búsqueda o seleccionar tu ubicación en el mapa de manera manual.')
          setIsValid(false)
          onValidationChange?.(false, 'No encontramos la dirección ingresada')
        }
      }
    )
  }

  // NO obtener sugerencias - eliminado para evitar errores de Places API

  // Búsqueda automática con debounce - sin necesidad de presionar botón
  useEffect(() => {
    const trimmed = selectedAddress.trim()
    if (trimmed.length < 5) return
    if (trimmed === lastSearchedAddressRef.current) return

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null
      lastSearchedAddressRef.current = trimmed
      handleSearch(trimmed)
    }, 600)

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [selectedAddress])

  const handleClear = () => {
    lastSearchedAddressRef.current = ''
    setSelectedAddress('')
    setSelectedCoordinates(null)
    setIsValid(null)
    setErrorMessage(undefined)
    onChange('')
    onValidationChange?.(false, undefined)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDismissError = () => {
    setErrorMessage(undefined)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSelectedAddress(value)
    
    // Limpiar validación cuando se cambia el input
    if (value.trim() === '') {
      setIsValid(null)
      setErrorMessage(undefined)
    }
  }

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

      {/* Input de dirección - búsqueda automática al escribir (sin botón lupa) */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedAddress}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && selectedAddress.trim().length >= 5) {
              e.preventDefault()
              if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
              handleSearch()
            }
          }}
          placeholder="Dirección (calle y número) o lugar de entrega"
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 pr-12 text-base border rounded-lg transition-all duration-200',
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
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {isSearching && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          {!isSearching && isValid && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {!isSearching && errorMessage && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          {selectedAddress && !disabled && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mensajes de error mejorados */}
      {errorMessage && (
        <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-800">
                {errorMessage}
              </p>
              <Button
                type="button"
                onClick={scrollToMap}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <MapPin className="w-4 h-4" />
                Seleccionar en mapa
              </Button>
            </div>
            <button
              type="button"
              onClick={handleDismissError}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Cerrar error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isValid && !errorMessage && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Ubicación válida en {cityName}, Córdoba
        </p>
      )}

      {/* Mapa siempre visible */}
      <div>
        
        <div 
          ref={mapRef}
          data-testid="map-container"
          className="w-full h-96 border border-gray-300 rounded-lg"
          style={{ minHeight: '384px' }}
        />
      </div>

      {/* Mensajes de error de API key */}
      {apiKeyError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">
                Error cargando Google Maps
              </p>
              <p className="text-sm text-red-700">
                {apiKeyError}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-red-600 mt-2">
                  Tenant: {tenant.slug} | API Key: {finalApiKey ? `${finalApiKey.substring(0, 10)}...` : 'NO CONFIGURADA'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Mensaje de modo demo */}
      {finalApiKey === 'DEMO_KEY' && !apiKeyError && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          ⚠️ <strong>Modo Demo:</strong> Google Maps API no configurada. La validación es básica.
        </div>
      )}

    </div>
  )
}
