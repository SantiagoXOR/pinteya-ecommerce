'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddressMapSelectorAdvanced } from '@/components/ui/AddressMapSelectorAdvanced'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function TestAddressAdvancedPage() {
  const [address, setAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | undefined>()

  const handleAddressChange = (newAddress: string, newCoordinates?: { lat: number; lng: number }) => {
    setAddress(newAddress)
    if (newCoordinates) {
      setCoordinates(newCoordinates)
    }
  }

  const handleValidationChange = (valid: boolean, errorMessage?: string) => {
    setIsValid(valid)
    setError(errorMessage)
  }

  const handleSubmit = () => {
    if (isValid) {
      alert(`Dirección válida: ${address}`)
    } else {
      alert('Por favor selecciona una dirección válida en Córdoba Capital')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prueba de Selector de Dirección Avanzado
          </h1>
          <p className="text-gray-600">
            Valida automáticamente direcciones en Córdoba Capital usando Google Places API
          </p>
        </div>

        <div className="grid gap-6">
          {/* Selector de dirección */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗺️ Selector de Dirección Avanzado
              </CardTitle>
              <CardDescription>
                Escribe cualquier dirección y el sistema validará automáticamente si está en Córdoba Capital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de mapa */}
              <AddressMapSelectorAdvanced
                value={address}
                onChange={handleAddressChange}
                onValidationChange={handleValidationChange}
                required
                label="Dirección de entrega"
                error={error}
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
              <CardTitle>🧪 Direcciones de Prueba</CardTitle>
              <CardDescription>
                Prueba estas direcciones para verificar la validación automática
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-green-700">✅ Válidas (Córdoba Capital)</h4>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• San Martín 123, Córdoba</li>
                    <li>• Av. Colón 456, Córdoba</li>
                    <li>• 25 de Mayo 789, Córdoba</li>
                    <li>• Belgrano 321, Córdoba</li>
                    <li>• Rivadavia 654, Córdoba</li>
                  </ul>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-red-700">❌ Inválidas (Fuera de Córdoba Capital)</h4>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• España 375, Alta Gracia, Córdoba</li>
                    <li>• Av. San Martín 123, Villa Carlos Paz, Córdoba</li>
                    <li>• Rivadavia 456, Río Cuarto, Córdoba</li>
                    <li>• San Martín 789, Buenos Aires</li>
                    <li>• Av. Corrientes 123, Rosario, Santa Fe</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características del componente */}
          <Card>
            <CardHeader>
              <CardTitle>✨ Características del Componente</CardTitle>
              <CardDescription>
                Funcionalidades implementadas en el selector avanzado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-700 mb-2">🎯 Validación Automática</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Autocompletado con Google Places API</li>
                    <li>• Validación geográfica automática</li>
                    <li>• Solo acepta Córdoba Capital</li>
                    <li>• No requiere escribir "Córdoba"</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-700 mb-2">🗺️ Funcionalidades del Mapa</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mapa interactivo con Google Maps</li>
                    <li>• Marcador arrastrable</li>
                    <li>• Click en el mapa para seleccionar</li>
                    <li>• Restricción a Córdoba Capital</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-purple-700 mb-2">📍 Geolocalización</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Botón "Mi Ubicación" con GPS</li>
                    <li>• Validación automática de ubicación</li>
                    <li>• Mensajes de error informativos</li>
                    <li>• Fallback a selección manual</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-orange-700 mb-2">🎨 Experiencia de Usuario</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Interfaz intuitiva y clara</li>
                    <li>• Estados visuales (válido/inválido)</li>
                    <li>• Mensajes de ayuda contextual</li>
                    <li>• Diseño responsive</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de API */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Configuración de API</CardTitle>
              <CardDescription>
                Estado actual de la configuración de Google Maps API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">API Key Status:</h4>
                  <code className="text-sm text-gray-600">
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'DEMO_KEY'}
                  </code>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Nota:</strong> Si ves "DEMO_KEY", el componente funcionará en modo demo con validación básica.</p>
                  <p>Para funcionalidad completa, configura una API key válida en las variables de entorno.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
