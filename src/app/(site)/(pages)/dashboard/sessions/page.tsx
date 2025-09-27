'use client'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'
import React from 'react'
import { Monitor, MapPin, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function UserSessionsPage() {
  // Datos de ejemplo para sesiones
  const currentSession = {
    id: 'current',
    device: 'Chrome en Windows',
    location: 'Buenos Aires, Argentina',
    ip: '192.168.1.100',
    lastActive: 'Ahora',
    isCurrent: true,
  }

  const otherSessions = [
    {
      id: '1',
      device: 'Safari en iPhone',
      location: 'Buenos Aires, Argentina',
      ip: '192.168.1.101',
      lastActive: 'Hace 2 horas',
      isCurrent: false,
    },
  ]

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Gestión de Sesiones</h1>
        <p className='text-gray-600'>
          Controla y gestiona todas tus sesiones activas en diferentes dispositivos.
        </p>
      </div>

      {/* Current Session */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Monitor className='h-5 w-5 text-green-500' />
            Sesión Actual
          </CardTitle>
          <CardDescription>Esta es la sesión que estás usando actualmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center gap-4'>
              <div className='p-2 bg-green-100 rounded-full'>
                <Monitor className='h-5 w-5 text-green-600' />
              </div>
              <div>
                <h3 className='font-medium text-gray-900'>{currentSession.device}</h3>
                <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
                  <span className='flex items-center gap-1'>
                    <MapPin className='h-3 w-3' />
                    {currentSession.location}
                  </span>
                  <span className='flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    {currentSession.lastActive}
                  </span>
                </div>
                <p className='text-xs text-gray-500 mt-1'>IP: {currentSession.ip}</p>
              </div>
            </div>
            <span className='px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full'>
              Activa
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Other Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Monitor className='h-5 w-5' />
            Otras Sesiones
          </CardTitle>
          <CardDescription>
            Sesiones activas en otros dispositivos. Puedes cerrar cualquier sesión sospechosa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otherSessions.length > 0 ? (
            <div className='space-y-4'>
              {otherSessions.map(session => (
                <div
                  key={session.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex items-center gap-4'>
                    <div className='p-2 bg-gray-100 rounded-full'>
                      <Monitor className='h-5 w-5 text-gray-600' />
                    </div>
                    <div>
                      <h3 className='font-medium text-gray-900'>{session.device}</h3>
                      <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
                        <span className='flex items-center gap-1'>
                          <MapPin className='h-3 w-3' />
                          {session.location}
                        </span>
                        <span className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {session.lastActive}
                        </span>
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>IP: {session.ip}</p>
                    </div>
                  </div>
                  <Button variant='outline' size='sm'>
                    Cerrar Sesión
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8'>
              <Monitor className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>No hay otras sesiones</h3>
              <p className='text-gray-600'>Solo tienes una sesión activa en este momento.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alert */}
      <Card className='border-orange-200 bg-orange-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-orange-800'>
            <AlertTriangle className='h-5 w-5' />
            Consejos de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-2 text-sm text-orange-700'>
            <li>• Cierra sesión en dispositivos que no reconozcas</li>
            <li>• Revisa regularmente tus sesiones activas</li>
            <li>• Usa contraseñas seguras y únicas</li>
            <li>• Habilita la autenticación de dos factores cuando esté disponible</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
