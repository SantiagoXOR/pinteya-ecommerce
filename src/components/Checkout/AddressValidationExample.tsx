'use client'

import React, { useState } from 'react'
import { AddressInput } from '@/components/ui/AddressInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, MapPin } from '@/lib/optimized-imports'

/**
 * Componente de ejemplo que demuestra el uso del AddressInput
 * con validación de Córdoba Capital
 */
export function AddressValidationExample() {
  const [address, setAddress] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | undefined>()

  const handleValidationChange = (valid: boolean, errorMessage?: string) => {
    setIsValid(valid)
    setError(errorMessage)
  }

  const handleSubmit = () => {
    if (isValid) {
      alert('¡Dirección válida! Proceder con el checkout.')
    } else {
      alert('Por favor, ingresa una dirección válida en Córdoba Capital.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Validación de Direcciones - Córdoba Capital
          </CardTitle>
          <CardDescription>
            Ejemplo de validación de direcciones usando Google Maps API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input de dirección */}
          <AddressInput
            value={address}
            onChange={setAddress}
            onValidationChange={handleValidationChange}
            placeholder="Av. Corrientes 1234, Córdoba"
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            showSuggestions={true}
            label="Dirección de entrega"
            required
          />

          {/* Estado de validación */}
          <div className="flex items-center gap-2">
            {isValid === null && (
              <Badge variant="secondary">Ingresa una dirección</Badge>
            )}
            {isValid === true && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Válida en Córdoba Capital
              </Badge>
            )}
            {isValid === false && (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error || 'Dirección inválida'}
              </Badge>
            )}
          </div>

          {/* Botón de envío */}
          <Button 
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full"
          >
            {isValid ? 'Continuar con el Checkout' : 'Ingresa una dirección válida'}
          </Button>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información sobre la Validación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <p><strong>¿Qué se valida?</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>La dirección debe estar en Córdoba Capital</li>
              <li>Se verifica geográficamente usando coordenadas</li>
              <li>Se valida por componentes de dirección</li>
              <li>Se proporcionan sugerencias de autocompletado</li>
            </ul>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Ejemplos de direcciones válidas:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Av. Corrientes 1234, Córdoba</li>
              <li>San Martín 567, Córdoba Capital</li>
              <li>Belgrano 890, Córdoba, Córdoba</li>
            </ul>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Ejemplos de direcciones inválidas:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Av. Corrientes 1234, Buenos Aires</li>
              <li>San Martín 567, Rosario</li>
              <li>Belgrano 890, Mendoza</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
