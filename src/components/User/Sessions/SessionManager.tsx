'use client'

import React, { useState } from 'react'
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Shield,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from '@/lib/optimized-imports'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserSessions, useSessionRegistration } from '@/hooks/useUserSessions'
import { toast } from 'sonner'

export function SessionManager() {
  const {
    sessions,
    isLoading,
    error,
    totalSessions,
    currentSession,
    remoteSessions,
    revokeSession,
    revokeAllSessions,
    trustDevice,
    refreshSessions,
  } = useUserSessions()

  // Registrar sesión actual
  useSessionRegistration()

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Función para obtener icono del dispositivo
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className='h-5 w-5' />
      case 'tablet':
        return <Tablet className='h-5 w-5' />
      default:
        return <Monitor className='h-5 w-5' />
    }
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return 'Hace unos minutos'
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
    }
  }

  // Función para cerrar sesión específica
  const handleRevokeSession = async (sessionId: string) => {
    setActionLoading(sessionId)
    try {
      await revokeSession(sessionId)
    } finally {
      setActionLoading(null)
    }
  }

  // Función para cerrar todas las sesiones
  const handleRevokeAllSessions = async () => {
    setActionLoading('all')
    try {
      await revokeAllSessions()
    } finally {
      setActionLoading(null)
    }
  }

  // Función para marcar dispositivo como confiable
  const handleTrustDevice = async (sessionId: string) => {
    setActionLoading(`trust-${sessionId}`)
    try {
      await trustDevice(sessionId)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading && sessions.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-center h-32'>
          <RefreshCw className='h-6 w-6 animate-spin text-gray-400' />
          <span className='ml-2 text-gray-600'>Cargando sesiones...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-center h-32'>
          <AlertTriangle className='h-6 w-6 text-red-500 mr-2' />
          <span className='text-red-600'>
            {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Estadísticas */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center'>
              <Monitor className='h-8 w-8 text-blue-500' />
              <div className='ml-3'>
                <p className='text-sm font-medium text-gray-600'>Sesiones Activas</p>
                <p className='text-2xl font-bold text-gray-900'>{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center'>
              <Shield className='h-8 w-8 text-green-500' />
              <div className='ml-3'>
                <p className='text-sm font-medium text-gray-600'>Dispositivos Confiables</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {sessions.filter(s => s.is_trusted).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center'>
              <Clock className='h-8 w-8 text-orange-500' />
              <div className='ml-3'>
                <p className='text-sm font-medium text-gray-600'>Última Actividad</p>
                <p className='text-sm font-bold text-gray-900'>
                  {currentSession ? formatDate(currentSession.last_activity) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>Acciones de Seguridad</h3>
          <div className='flex space-x-2'>
            <Button variant='outline' size='sm' onClick={refreshSessions} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {remoteSessions.length > 0 && (
              <Button
                variant='destructive'
                size='sm'
                onClick={handleRevokeAllSessions}
                disabled={actionLoading === 'all'}
              >
                <X className='h-4 w-4 mr-2' />
                Cerrar Todas las Sesiones Remotas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sesión Actual */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <CheckCircle className='h-5 w-5 text-green-500 mr-2' />
              Sesión Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center text-gray-600'>
                  {getDeviceIcon(currentSession.device_type)}
                  <span className='ml-2 font-medium'>{currentSession.device_name}</span>
                </div>
                <Badge variant='secondary' className='bg-green-100 text-green-800'>
                  Actual
                </Badge>
                {currentSession.is_trusted && (
                  <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
                    <Shield className='h-3 w-3 mr-1' />
                    Confiable
                  </Badge>
                )}
              </div>
              <div className='text-sm text-gray-500'>
                <div className='flex items-center'>
                  <MapPin className='h-4 w-4 mr-1' />
                  {currentSession.ip_address}
                </div>
                <div className='flex items-center mt-1'>
                  <Clock className='h-4 w-4 mr-1' />
                  {formatDate(currentSession.last_activity)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sesiones Remotas */}
      {remoteSessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Otras Sesiones ({remoteSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {remoteSessions.map(session => (
                <div
                  key={session.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex items-center space-x-4'>
                    <div className='flex items-center text-gray-600'>
                      {getDeviceIcon(session.device_type)}
                      <span className='ml-2 font-medium'>{session.device_name}</span>
                    </div>
                    {session.is_trusted && (
                      <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
                        <Shield className='h-3 w-3 mr-1' />
                        Confiable
                      </Badge>
                    )}
                  </div>

                  <div className='flex items-center space-x-4'>
                    <div className='text-sm text-gray-500 text-right'>
                      <div className='flex items-center'>
                        <MapPin className='h-4 w-4 mr-1' />
                        {session.ip_address}
                      </div>
                      <div className='flex items-center mt-1'>
                        <Clock className='h-4 w-4 mr-1' />
                        {formatDate(session.last_activity)}
                      </div>
                    </div>

                    <div className='flex space-x-2'>
                      {!session.is_trusted && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleTrustDevice(session.id)}
                          disabled={actionLoading === `trust-${session.id}`}
                        >
                          <Shield className='h-4 w-4 mr-1' />
                          Confiar
                        </Button>
                      )}
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={actionLoading === session.id}
                      >
                        <X className='h-4 w-4 mr-1' />
                        Cerrar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='p-6'>
            <div className='text-center text-gray-500'>
              <Monitor className='h-12 w-12 mx-auto mb-4 text-gray-400' />
              <p>No hay otras sesiones activas</p>
              <p className='text-sm mt-1'>Solo tienes una sesión activa en este dispositivo</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
