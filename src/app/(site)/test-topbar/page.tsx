"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Phone, MapPin, Navigation } from 'lucide-react';

export default function TestTopBarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Prueba del TopBar Mejorado
        </h1>
        
        <div className="space-y-6">
          {/* Información de las mejoras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Mejoras Implementadas en el TopBar
              </CardTitle>
              <CardDescription>
                Verificación de las correcciones y nuevas funcionalidades aplicadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Corrección del teléfono */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Número de Teléfono Corregido
                  </h3>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm text-green-700">
                      <strong>Nuevo:</strong> (351) 341-1796
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Link: tel:+5493513411796
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-sm text-red-700">
                      <strong>Anterior:</strong> (+54 9 351) 492-3477
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      ❌ Número incorrecto eliminado
                    </p>
                  </div>
                </div>

                {/* Información eliminada */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">
                    Información Eliminada
                  </h3>
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-sm text-red-700">
                      <strong>❌ Eliminado:</strong> "Lun-Vie 8:00-18:00 | Sáb 8:00-13:00"
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Horarios de atención removidos
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-700">
                      <strong>🔄 Cambiado:</strong> "Asesoramiento 24/7" → "Asesoramiento en vivo"
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Sin indicar disponibilidad 24/7
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geolocalización */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Geolocalización Automática
              </CardTitle>
              <CardDescription>
                Nueva funcionalidad para detectar automáticamente la zona de entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Funcionalidades Implementadas:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ Detección automática de ubicación del usuario</li>
                    <li>✅ Cálculo de zona de entrega más cercana</li>
                    <li>✅ Fallback a selector manual si no hay permisos</li>
                    <li>✅ Manejo de errores de geolocalización</li>
                    <li>✅ Indicador visual de ubicación detectada</li>
                    <li>✅ Botón para solicitar permisos de ubicación</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Zonas de Entrega Configuradas:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Córdoba Capital</span>
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        Disponible
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Interior de Córdoba</span>
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        Disponible
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Buenos Aires</span>
                      <Badge variant="secondary">Próximamente</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rosario</span>
                      <Badge variant="secondary">Próximamente</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instrucciones de prueba */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones de Prueba</CardTitle>
              <CardDescription>
                Cómo probar las nuevas funcionalidades del TopBar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Para probar la geolocalización:
                  </h4>
                  <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Haz clic en el dropdown "Envíos en..." en el TopBar</li>
                    <li>Selecciona "Detectar mi ubicación"</li>
                    <li>Permite el acceso a la ubicación cuando el navegador lo solicite</li>
                    <li>Observa cómo se actualiza automáticamente la zona detectada</li>
                    <li>Verifica que aparece el indicador "Ubicación detectada"</li>
                  </ol>
                </div>

                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Para probar el teléfono:
                  </h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Haz clic en el número de teléfono en el TopBar</li>
                    <li>Verifica que se abre la aplicación de llamadas</li>
                    <li>Confirma que el número es: (351) 341-1796</li>
                  </ol>
                </div>

                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Verificaciones visuales:
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                    <li>El TopBar solo es visible en desktop (hidden lg:block)</li>
                    <li>Los colores mantienen el design system (accent-600)</li>
                    <li>Las animaciones y microinteracciones funcionan</li>
                    <li>El texto dice "Asesoramiento en vivo" (no 24/7)</li>
                    <li>No aparecen horarios de atención</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
