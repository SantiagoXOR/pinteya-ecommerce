'use client'

import React, { useState } from 'react'
import {
  Shield,
  Lock,
  Bell,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useSecuritySettings,
  useSecurityAlerts,
  useSecurityValidation,
} from '@/hooks/useSecuritySettings'
import { toast } from 'sonner'

export function SecuritySettings() {
  const {
    settings,
    alerts,
    stats,
    isLoading,
    error,
    updateSettings,
    toggleTwoFactor,
    updateAlertSettings,
    updateSessionSettings,
    refreshSettings,
  } = useSecuritySettings()

  const { getSeverityColor, getSeverityIcon, formatAlertType } = useSecurityAlerts()
  const {
    validateSessionTimeout,
    validateMaxSessions,
    getSecurityScore,
    getSecurityRecommendations,
  } = useSecurityValidation()

  const [sessionTimeout, setSessionTimeout] = useState(settings?.session_timeout || 43200)
  const [maxSessions, setMaxSessions] = useState(settings?.max_concurrent_sessions || 5)
  const [isUpdating, setIsUpdating] = useState(false)

  // Actualizar valores locales cuando cambian los settings
  React.useEffect(() => {
    if (settings) {
      setSessionTimeout(settings.session_timeout)
      setMaxSessions(settings.max_concurrent_sessions)
    }
  }, [settings])

  const handleSessionSettingsUpdate = async () => {
    const timeoutError = validateSessionTimeout(sessionTimeout)
    const sessionsError = validateMaxSessions(maxSessions)

    if (timeoutError) {
      toast.error(timeoutError)
      return
    }

    if (sessionsError) {
      toast.error(sessionsError)
      return
    }

    setIsUpdating(true)
    try {
      await updateSessionSettings({
        session_timeout: sessionTimeout,
        max_concurrent_sessions: maxSessions,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading && !settings) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-center h-32'>
          <RefreshCw className='h-6 w-6 animate-spin text-gray-400' />
          <span className='ml-2 text-gray-600'>Cargando configuración de seguridad...</span>
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
            {error instanceof Error ? error.message : String(error) || 'Error desconocido'}
          </span>
        </div>
      </div>
    )
  }

  const securityScore = getSecurityScore(settings)
  const recommendations = getSecurityRecommendations(settings)

  return (
    <div className='space-y-6'>
      {/* Puntuación de Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Shield className='h-5 w-5 mr-2' />
            Puntuación de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <div className='text-3xl font-bold text-gray-900'>{securityScore}/100</div>
              <div className='text-sm text-gray-600'>
                {securityScore >= 80
                  ? 'Excelente'
                  : securityScore >= 60
                    ? 'Buena'
                    : securityScore >= 40
                      ? 'Regular'
                      : 'Necesita mejoras'}
              </div>
            </div>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                securityScore >= 80
                  ? 'bg-green-100 text-green-600'
                  : securityScore >= 60
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-red-100 text-red-600'
              }`}
            >
              <Shield className='h-8 w-8' />
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className='mt-4'>
              <h4 className='text-sm font-medium text-gray-900 mb-2'>Recomendaciones:</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                {recommendations.map((rec, index) => (
                  <li key={index} className='flex items-start'>
                    <span className='text-yellow-500 mr-2'>•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center'>
                <Users className='h-6 w-6 text-blue-500' />
                <div className='ml-3'>
                  <p className='text-sm font-medium text-gray-600'>Sesiones Activas</p>
                  <p className='text-xl font-bold text-gray-900'>{stats.activeSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center'>
                <AlertTriangle className='h-6 w-6 text-red-500' />
                <div className='ml-3'>
                  <p className='text-sm font-medium text-gray-600'>Alertas Pendientes</p>
                  <p className='text-xl font-bold text-gray-900'>{stats.unresolvedAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center'>
                <Shield className='h-6 w-6 text-green-500' />
                <div className='ml-3'>
                  <p className='text-sm font-medium text-gray-600'>Dispositivos (30d)</p>
                  <p className='text-xl font-bold text-gray-900'>{stats.uniqueDevicesLast30Days}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center'>
                <Clock className='h-6 w-6 text-orange-500' />
                <div className='ml-3'>
                  <p className='text-sm font-medium text-gray-600'>Última Actividad</p>
                  <p className='text-sm font-bold text-gray-900'>
                    {stats.lastSuspiciousActivity ? 'Reciente' : 'Ninguna'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuración */}
      <Tabs defaultValue='authentication' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='authentication'>Autenticación</TabsTrigger>
          <TabsTrigger value='alerts'>Alertas</TabsTrigger>
          <TabsTrigger value='sessions'>Sesiones</TabsTrigger>
        </TabsList>

        {/* Tab de Autenticación */}
        <TabsContent value='authentication'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Lock className='h-5 w-5 mr-2' />
                Configuración de Autenticación
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base font-medium'>
                    Autenticación de Dos Factores (2FA)
                  </Label>
                  <p className='text-sm text-gray-600'>
                    Agrega una capa extra de seguridad a tu cuenta
                  </p>
                </div>
                <Switch
                  checked={settings?.two_factor_enabled || false}
                  onCheckedChange={toggleTwoFactor}
                  disabled={isLoading}
                />
              </div>

              {settings?.two_factor_enabled && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <div className='flex items-center'>
                    <CheckCircle className='h-5 w-5 text-green-500 mr-2' />
                    <span className='text-green-800 font-medium'>2FA Activado</span>
                  </div>
                  <p className='text-green-700 text-sm mt-1'>
                    Tu cuenta está protegida con autenticación de dos factores
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Alertas */}
        <TabsContent value='alerts'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Bell className='h-5 w-5 mr-2' />
                Configuración de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base font-medium'>Alertas de Inicio de Sesión</Label>
                    <p className='text-sm text-gray-600'>
                      Recibe notificaciones cuando alguien inicie sesión en tu cuenta
                    </p>
                  </div>
                  <Switch
                    checked={settings?.login_alerts || false}
                    onCheckedChange={checked => updateAlertSettings({ login_alerts: checked })}
                    disabled={isLoading}
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base font-medium'>Alertas de Actividad Sospechosa</Label>
                    <p className='text-sm text-gray-600'>
                      Detecta y notifica actividad inusual en tu cuenta
                    </p>
                  </div>
                  <Switch
                    checked={settings?.suspicious_activity_alerts || false}
                    onCheckedChange={checked =>
                      updateAlertSettings({ suspicious_activity_alerts: checked })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base font-medium'>Alertas de Nuevos Dispositivos</Label>
                    <p className='text-sm text-gray-600'>
                      Notifica cuando se detecte un nuevo dispositivo
                    </p>
                  </div>
                  <Switch
                    checked={settings?.new_device_alerts || false}
                    onCheckedChange={checked => updateAlertSettings({ new_device_alerts: checked })}
                    disabled={isLoading}
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base font-medium'>Alertas de Cambio de Contraseña</Label>
                    <p className='text-sm text-gray-600'>
                      Confirma cambios importantes en tu cuenta
                    </p>
                  </div>
                  <Switch
                    checked={settings?.password_change_alerts || false}
                    onCheckedChange={checked =>
                      updateAlertSettings({ password_change_alerts: checked })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Sesiones */}
        <TabsContent value='sessions'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Settings className='h-5 w-5 mr-2' />
                Configuración de Sesiones
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <Label htmlFor='session-timeout' className='text-base font-medium'>
                    Tiempo de Sesión (minutos)
                  </Label>
                  <p className='text-sm text-gray-600 mb-2'>
                    Tiempo antes de que expire la sesión automáticamente
                  </p>
                  <Input
                    id='session-timeout'
                    type='number'
                    min='1'
                    max='43200'
                    value={sessionTimeout}
                    onChange={e => setSessionTimeout(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <Label htmlFor='max-sessions' className='text-base font-medium'>
                    Máximo de Sesiones Concurrentes
                  </Label>
                  <p className='text-sm text-gray-600 mb-2'>
                    Número máximo de sesiones activas simultáneamente
                  </p>
                  <Input
                    id='max-sessions'
                    type='number'
                    min='1'
                    max='20'
                    value={maxSessions}
                    onChange={e => setMaxSessions(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base font-medium'>Solo Dispositivos Confiables</Label>
                  <p className='text-sm text-gray-600'>
                    Permitir acceso solo desde dispositivos marcados como confiables
                  </p>
                </div>
                <Switch
                  checked={settings?.trusted_devices_only || false}
                  onCheckedChange={checked =>
                    updateSessionSettings({ trusted_devices_only: checked })
                  }
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleSessionSettingsUpdate}
                disabled={isUpdating}
                className='w-full'
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                    Actualizando...
                  </>
                ) : (
                  'Guardar Configuración de Sesiones'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertas Recientes */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <AlertTriangle className='h-5 w-5 mr-2' />
              Alertas de Seguridad Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {alerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className='flex items-start justify-between p-3 border border-gray-200 rounded-lg'
                >
                  <div className='flex items-start space-x-3'>
                    <span className='text-lg'>{getSeverityIcon(alert.severity)}</span>
                    <div>
                      <h4 className='font-medium text-gray-900'>{alert.title}</h4>
                      <p className='text-sm text-gray-600'>{alert.description}</p>
                      <div className='flex items-center space-x-2 mt-1'>
                        <Badge variant='secondary' className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className='text-xs text-gray-500'>{formatAlertType(alert.type)}</span>
                      </div>
                    </div>
                  </div>
                  <div className='text-xs text-gray-500'>
                    {new Date(alert.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
