'use client'

import React, { useState } from 'react'
import { AddressInput } from '@/components/ui/AddressInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, MapPin, TestTube } from 'lucide-react'

/**
 * Página de prueba para la validación de direcciones
 * Accesible en /test-address-validation
 */
export default function TestAddressValidationPage() {
  const [address, setAddress] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [testResults, setTestResults] = useState<Array<{
    address: string
    expected: boolean
    actual: boolean
    result: 'pass' | 'fail'
  }>>([])

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

  // Casos de prueba para validación
  const testCases = [
    { address: 'Av. Corrientes 1234, Córdoba', expected: true },
    { address: 'San Martín 567, Córdoba Capital', expected: true },
    { address: 'Belgrano 890, Córdoba, Córdoba', expected: true },
    { address: 'Av. Corrientes 1234, Buenos Aires', expected: false },
    { address: 'San Martín 567, Rosario', expected: false },
    { address: 'Belgrano 890, Mendoza', expected: false },
    { address: 'Av. Colón 1000, Córdoba', expected: true },
    { address: 'Calle Falsa 123, Córdoba', expected: true },
  ]

  const runTests = async () => {
    const results = []
    
    for (const testCase of testCases) {
      try {
        // Simular validación (en un caso real, llamarías a la API)
        const response = await fetch('/api/user/addresses/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            street: testCase.address.split(',')[0],
            city: 'Córdoba',
            state: 'Córdoba',
            postal_code: '5000',
            country: 'Argentina'
          })
        })
        
        const data = await response.json()
        const actual = data.data?.isValid || false
        
        results.push({
          address: testCase.address,
          expected: testCase.expected,
          actual,
          result: actual === testCase.expected ? 'pass' : 'fail'
        })
      } catch (error) {
        results.push({
          address: testCase.address,
          expected: testCase.expected,
          actual: false,
          result: 'fail'
        })
      }
    }
    
    setTestResults(results)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Prueba de Validación de Direcciones
          </h1>
          <p className="text-gray-600">
            Sistema de validación para Córdoba Capital usando Google Maps API
          </p>
        </div>

        {/* Componente principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Validación de Direcciones - Córdoba Capital
            </CardTitle>
            <CardDescription>
              Ingresa una dirección para validar que esté en Córdoba Capital
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input de dirección */}
            <AddressInput
              value={address}
              onChange={setAddress}
              onValidationChange={handleValidationChange}
              placeholder="Av. Corrientes 1234, Córdoba"
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

        {/* Pruebas automatizadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Pruebas Automatizadas
            </CardTitle>
            <CardDescription>
              Ejecuta pruebas para verificar que la validación funciona correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTests} className="w-full">
              Ejecutar Pruebas
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Resultados de las Pruebas:</h4>
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${
                        result.result === 'pass' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <span className="text-sm">{result.address}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Esperado: {result.expected ? 'Válida' : 'Inválida'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Actual: {result.actual ? 'Válida' : 'Inválida'}
                        </span>
                        <Badge
                          variant={result.result === 'pass' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {result.result === 'pass' ? '✓' : '✗'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600">
                  <strong>Resumen:</strong> {testResults.filter(r => r.result === 'pass').length} de {testResults.length} pruebas pasaron
                </div>
              </div>
            )}
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
                <li>Se verifica geográficamente usando coordenadas GPS</li>
                <li>Se valida por componentes de dirección (locality y administrative_area_level_1)</li>
                <li>Se proporcionan sugerencias de autocompletado en tiempo real</li>
              </ul>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Ejemplos de direcciones válidas:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Av. Corrientes 1234, Córdoba</li>
                <li>San Martín 567, Córdoba Capital</li>
                <li>Belgrano 890, Córdoba, Córdoba</li>
                <li>Av. Colón 1000, Córdoba</li>
              </ul>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Ejemplos de direcciones inválidas:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Av. Corrientes 1234, Buenos Aires</li>
                <li>San Martín 567, Rosario</li>
                <li>Belgrano 890, Mendoza</li>
                <li>Cualquier dirección fuera de Córdoba Capital</li>
              </ul>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>API Key utilizada:</strong></p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBBDvjcC42QcHu7qlToPK4tTaV7EdvtJmc'}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
