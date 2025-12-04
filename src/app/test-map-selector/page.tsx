'use client'

import React, { useState, useEffect } from 'react'
import { AddressMapSelector } from '@/components/ui/AddressMapSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, MapPin, TestTube, Navigation } from 'lucide-react'

/**
 * Página de prueba para el selector de mapa interactivo
 * Accesible en /test-map-selector
 */
export default function TestMapSelectorPage() {
  // Bloquear indexación para SEO
  useEffect(() => {
    const metaRobots = document.querySelector('meta[name="robots"]')
    if (!metaRobots) {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = 'noindex, nofollow'
      document.head.appendChild(meta)
    } else {
      metaRobots.setAttribute('content', 'noindex, nofollow')
    }
  }, [])
  const [address, setAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | undefined>()

  const handleAddressChange = (newAddress: string, newCoordinates?: { lat: number; lng: number }) => {
    setAddress(newAddress)
    setCoordinates(newCoordinates || null)
  }

  const handleValidationChange = (valid: boolean, errorMessage?: string) => {
    setIsValid(valid)
    setError(errorMessage)
  }

  const handleSubmit = () => {
    if (isValid && coordinates) {
      alert(`¡Ubicación válida!\nDirección: ${address}\nCoordenadas: ${coordinates.lat}, ${coordinates.lng}`)
    } else {
      alert('Por favor, selecciona una ubicación válida en Córdoba Capital.')
    }
  }

  const testAddresses = [
    { name: 'Centro de Córdoba', address: 'San Martín 123, Córdoba', lat: -31.4201, lng: -64.1888 },
    { name: 'Nueva Córdoba', address: 'Av. Humberto Primo 456, Córdoba', lat: -31.4300, lng: -64.1900 },
    { name: 'Villa Allende', address: 'Av. Córdoba 789, Córdoba', lat: -31.4100, lng: -64.2000 },
  ]

  const setTestAddress = (testAddress: typeof testAddresses[0]) => {
    setAddress(testAddress.address)
    setCoordinates({ lat: testAddress.lat, lng: testAddress.lng })
    setIsValid(true)
    setError(undefined)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Selector de Mapa Interactivo
          </h1>
          <p className="text-gray-600">
            Selecciona tu ubicación arrastrando el marcador en el mapa
          </p>
        </div>

        {/* Componente principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Selección de Ubicación - Córdoba Capital
            </CardTitle>
            <CardDescription>
              Arrastra el marcador azul en el mapa para seleccionar tu domicilio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de mapa */}
            <AddressMapSelector
              value={address}
              onChange={handleAddressChange}
              onValidationChange={handleValidationChange}
              required
              label="Ubicación de entrega"
              error={error}
              showDevButtons={true} // Mostrar botones de desarrollo solo en la página de prueba
            />

            {/* Estado de validación */}
            <div className="flex items-center gap-2">
              {isValid === null && (
                <Badge variant="secondary">Selecciona una ubicación</Badge>
              )}
              {isValid === true && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ubicación válida en Córdoba Capital
                </Badge>
              )}
              {isValid === false && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {error || 'Ubicación inválida'}
                </Badge>
              )}
            </div>

            {/* Información de coordenadas */}
            {coordinates && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Coordenadas seleccionadas:</strong><br />
                Latitud: {coordinates.lat.toFixed(6)}<br />
                Longitud: {coordinates.lng.toFixed(6)}
              </div>
            )}

            {/* Botón de envío */}
            <Button 
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full"
            >
              {isValid ? 'Continuar con el Checkout' : 'Selecciona una ubicación válida'}
            </Button>
          </CardContent>
        </Card>

        {/* Direcciones de prueba */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Direcciones de Prueba
            </CardTitle>
            <CardDescription>
              Haz clic en una dirección para probarla automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {testAddresses.map((testAddress, index) => (
              <button
                key={index}
                data-testid="test-address"
                onClick={() => setTestAddress(testAddress)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{testAddress.name}</div>
                    <div className="text-sm text-gray-600">{testAddress.address}</div>
                    <div className="text-xs text-gray-500">
                      {testAddress.lat}, {testAddress.lng}
                    </div>
                  </div>
                  <Navigation className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">
              <p><strong>¿Cómo usar el selector de mapa?</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Haz clic en "Mostrar Mapa" para abrir el mapa interactivo</li>
                <li>Arrastra el marcador azul a tu domicilio exacto</li>
                <li>O haz clic en cualquier punto del mapa para mover el marcador</li>
                <li>Usa "Mi Ubicación" para centrar el mapa en tu posición actual</li>
                <li>Se recomienda seleccionar ubicaciones en Córdoba Capital para entrega</li>
              </ul>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Características del mapa:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Centrado en Córdoba Capital con navegación flexible</li>
                <li>Geocodificación automática al seleccionar ubicación</li>
                <li>Validación en tiempo real con advertencias informativas</li>
                <li>Interfaz responsive para móviles</li>
                <li>Indicadores visuales de estado</li>
              </ul>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>API Key utilizada:</strong></p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'CONFIGURAR_VARIABLE_ENTORNO'}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
