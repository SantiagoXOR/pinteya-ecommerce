'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone,
  Monitor,
  Tablet,
  Shield,
  ShieldCheck,
  ShieldX,
  MoreVertical,
  Calendar,
  MapPin,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserSessions } from '@/hooks/useUserSessions'
import { toast } from 'sonner'

interface TrustedDevice {
  id: string
  device_name: string
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  ip_address: string
  location?: string
  is_trusted: boolean
  last_activity: string
  created_at: string
  trust_level: number
}

export function TrustedDevices() {
  const { sessions, isLoading, refreshSessions } = useUserSessions()
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([])

  useEffect(() => {
    if (sessions) {
      // Filtrar solo dispositivos de confianza
      const trusted = sessions.filter(session => session.is_trusted)
      setTrustedDevices(trusted)
    }
  }, [sessions])

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className='h-5 w-5' />
      case 'tablet':
        return <Tablet className='h-5 w-5' />
      default:
        return <Monitor className='h-5 w-5' />
    }
  }

  const getTrustLevelColor = (trustLevel: number) => {
    if (trustLevel >= 80) return 'text-green-600 bg-green-50'
    if (trustLevel >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getTrustLevelText = (trustLevel: number) => {
    if (trustLevel >= 80) return 'Alta confianza'
    if (trustLevel >= 60) return 'Confianza media'
    return 'Confianza baja'
  }

  const handleTrustDevice = async (deviceId: string, trust: boolean) => {
    try {
      const response = await fetch(`/api/user/trusted-devices/${deviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_trusted: trust }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar dispositivo')
      }

      await refreshSessions()
      toast.success(
        trust ? 'Dispositivo marcado como confiable' : 'Confianza removida del dispositivo'
      )
    } catch (error) {
      toast.error('Error al actualizar dispositivo')
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar este dispositivo de confianza? Esto cerrará todas las sesiones activas en este dispositivo.'
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/user/trusted-devices/${deviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar dispositivo')
      }

      await refreshSessions()
      toast.success('Dispositivo eliminado correctamente')
    } catch (error) {
      toast.error('Error al eliminar dispositivo')
    }
  }

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Ahora mismo'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Shield className='h-5 w-5 mr-2' />
            Dispositivos de Confianza
          </CardTitle>
          <CardDescription>
            Gestiona los dispositivos que consideras seguros para acceder a tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='animate-pulse'>
                <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Shield className='h-5 w-5 mr-2' />
          Dispositivos de Confianza
        </CardTitle>
        <CardDescription>
          Gestiona los dispositivos que consideras seguros para acceder a tu cuenta. Los
          dispositivos de confianza no requerirán verificación adicional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trustedDevices.length === 0 ? (
          <div className='text-center py-8'>
            <ShieldX className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No hay dispositivos de confianza
            </h3>
            <p className='text-gray-600 mb-4'>
              Marca dispositivos como confiables para facilitar futuros accesos.
            </p>
            <Button onClick={refreshSessions} variant='outline'>
              Actualizar lista
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            {trustedDevices.map(device => (
              <div
                key={device.id}
                className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <div className='flex items-center space-x-4'>
                  <div className='flex-shrink-0'>{getDeviceIcon(device.device_type)}</div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-2 mb-1'>
                      <h4 className='text-sm font-medium text-gray-900 truncate'>
                        {device.device_name}
                      </h4>
                      <ShieldCheck className='h-4 w-4 text-green-600' />
                    </div>

                    <div className='flex items-center space-x-4 text-sm text-gray-600'>
                      <span>
                        {device.browser} en {device.os}
                      </span>
                      {device.location && (
                        <span className='flex items-center'>
                          <MapPin className='h-3 w-3 mr-1' />
                          {device.location}
                        </span>
                      )}
                    </div>

                    <div className='flex items-center space-x-4 mt-2'>
                      <span className='flex items-center text-xs text-gray-500'>
                        <Calendar className='h-3 w-3 mr-1' />
                        {formatLastActivity(device.last_activity)}
                      </span>

                      <Badge className={getTrustLevelColor(device.trust_level)}>
                        {getTrustLevelText(device.trust_level)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => handleTrustDevice(device.id, false)}>
                        <ShieldX className='h-4 w-4 mr-2' />
                        Remover confianza
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveDevice(device.id)}
                        className='text-red-600'
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Eliminar dispositivo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Información adicional */}
        <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
          <div className='flex items-start'>
            <Shield className='h-5 w-5 text-blue-600 mr-3 mt-0.5' />
            <div>
              <h4 className='font-medium text-blue-900 mb-1'>
                ¿Qué son los dispositivos de confianza?
              </h4>
              <p className='text-sm text-blue-800'>
                Los dispositivos de confianza son aquellos que has marcado como seguros. Estos
                dispositivos pueden acceder a tu cuenta sin verificación adicional, pero aún así se
                monitorean por actividad sospechosa.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className='flex justify-end space-x-3 mt-6'>
          <Button variant='outline' onClick={refreshSessions}>
            Actualizar lista
          </Button>
          <Button onClick={() => (window.location.href = '/dashboard/sessions')}>
            Ver todas las sesiones
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
