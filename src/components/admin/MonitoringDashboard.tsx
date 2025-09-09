'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { useProactiveMonitoring, useSystemHealth } from '../../hooks/useProactiveMonitoring'
import { ErrorPattern } from '../../lib/monitoring/proactive-monitoring'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Plus, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Cpu,
  HardDrive,
  Zap
} from 'lucide-react'

interface MonitoringDashboardProps {
  className?: string
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const {
    isMonitoring,
    stats,
    config,
    errorPatterns,
    loading,
    error,
    startMonitoring,
    stopMonitoring,
    updateConfig,
    addErrorPattern,
    removeErrorPattern,
    refreshStats,
    getHealthStatus,
    getHealthColor,
    getHealthIcon
  } = useProactiveMonitoring()

  const { health } = useSystemHealth()
  const [showAddPattern, setShowAddPattern] = useState(false)
  const [newPattern, setNewPattern] = useState<Partial<ErrorPattern>>({
    name: '',
    pattern: '',
    severity: 'medium',
    threshold: 5,
    timeWindow: 10,
    description: '',
    isActive: true
  })

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring()
    } else {
      startMonitoring()
    }
  }

  const handleConfigUpdate = (key: string, value: any) => {
    updateConfig({ [key]: value })
  }

  const handleAddPattern = () => {
    if (!newPattern.name || !newPattern.pattern) return

    const pattern: ErrorPattern = {
      id: `custom_${Date.now()}`,
      name: newPattern.name,
      pattern: newPattern.pattern,
      severity: newPattern.severity || 'medium',
      threshold: newPattern.threshold || 5,
      timeWindow: newPattern.timeWindow || 10,
      description: newPattern.description || '',
      isActive: newPattern.isActive ?? true
    }

    addErrorPattern(pattern)
    setNewPattern({
      name: '',
      pattern: '',
      severity: 'medium',
      threshold: 5,
      timeWindow: 10,
      description: '',
      isActive: true
    })
    setShowAddPattern(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando datos de monitoreo...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoreo Proactivo</h1>
          <p className="text-muted-foreground">
            Sistema de monitoreo y alertas en tiempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant={isMonitoring ? 'destructive' : 'default'}
            onClick={handleToggleMonitoring}
          >
            {isMonitoring ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Detener
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <Activity className={`h-4 w-4 ${getHealthColor()}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <span className="mr-2">{getHealthIcon()}</span>
              {getHealthStatus()}
            </div>
            <p className="text-xs text-muted-foreground">
              {health && `Uptime: ${formatUptime(health.uptime)}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores Totales</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalErrors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentAlerts || 0} alertas recientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrones Activos</CardTitle>
            <Settings className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePatterns || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {errorPatterns.length} patrones totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health ? `${Math.round(health.responseTime)}ms` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {health && health.responseTime > 1000 ? (
                <span className="text-red-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Alto
                </span>
              ) : (
                <span className="text-green-500 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Normal
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Details */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas del Sistema</CardTitle>
            <CardDescription>
              Información detallada sobre el rendimiento del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <Cpu className="h-4 w-4 mr-2" />
                    CPU
                  </span>
                  <span className="text-sm">{Math.round(health.cpuUsage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      health.cpuUsage > 80 ? 'bg-red-500' : 
                      health.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${health.cpuUsage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <HardDrive className="h-4 w-4 mr-2" />
                    Memoria
                  </span>
                  <span className="text-sm">{Math.round(health.memoryUsage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      health.memoryUsage > 80 ? 'bg-red-500' : 
                      health.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${health.memoryUsage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Conexiones
                  </span>
                  <span className="text-sm">{health.activeConnections}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tasa de error: {health.errorRate.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Health Issues */}
            {health.issues.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Problemas Detectados</h4>
                <div className="space-y-2">
                  {health.issues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{issue.message}</span>
                        <p className="text-xs text-muted-foreground">{issue.type}</p>
                      </div>
                      <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Patrones de Error</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patrones de Error</CardTitle>
                  <CardDescription>
                    Gestiona los patrones de detección de errores
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddPattern(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Patrón
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddPattern && (
                <div className="mb-6 p-4 border rounded-lg space-y-4">
                  <h4 className="font-medium">Nuevo Patrón de Error</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="pattern-name">Nombre</Label>
                      <Input
                        id="pattern-name"
                        value={newPattern.name || ''}
                        onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                        placeholder="Nombre del patrón"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pattern-regex">Patrón (RegEx)</Label>
                      <Input
                        id="pattern-regex"
                        value={newPattern.pattern || ''}
                        onChange={(e) => setNewPattern({ ...newPattern, pattern: e.target.value })}
                        placeholder="error.*database|connection.*failed"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pattern-threshold">Umbral</Label>
                      <Input
                        id="pattern-threshold"
                        type="number"
                        value={newPattern.threshold || 5}
                        onChange={(e) => setNewPattern({ ...newPattern, threshold: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pattern-timewindow">Ventana de Tiempo (min)</Label>
                      <Input
                        id="pattern-timewindow"
                        type="number"
                        value={newPattern.timeWindow || 10}
                        onChange={(e) => setNewPattern({ ...newPattern, timeWindow: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pattern-description">Descripción</Label>
                    <Input
                      id="pattern-description"
                      value={newPattern.description || ''}
                      onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
                      placeholder="Descripción del patrón"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newPattern.isActive ?? true}
                        onCheckedChange={(checked) => setNewPattern({ ...newPattern, isActive: checked })}
                      />
                      <Label>Activo</Label>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => setShowAddPattern(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddPattern}>
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {errorPatterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{pattern.name}</h4>
                        <Badge variant="outline" className={getSeverityColor(pattern.severity)}>
                          {pattern.severity}
                        </Badge>
                        {!pattern.isActive && (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {pattern.pattern.toString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Umbral: {pattern.threshold} en {pattern.timeWindow} minutos
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeErrorPattern(pattern.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Monitoreo</CardTitle>
              <CardDescription>
                Ajusta los parámetros del sistema de monitoreo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="check-interval">Intervalo de Verificación (seg)</Label>
                  <Input
                    id="check-interval"
                    type="number"
                    value={config.checkInterval}
                    onChange={(e) => handleConfigUpdate('checkInterval', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="error-threshold">Umbral de Errores (%)</Label>
                  <Input
                    id="error-threshold"
                    type="number"
                    value={config.errorThreshold}
                    onChange={(e) => handleConfigUpdate('errorThreshold', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response-threshold">Umbral de Tiempo de Respuesta (ms)</Label>
                  <Input
                    id="response-threshold"
                    type="number"
                    value={config.responseTimeThreshold}
                    onChange={(e) => handleConfigUpdate('responseTimeThreshold', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memory-threshold">Umbral de Memoria (%)</Label>
                  <Input
                    id="memory-threshold"
                    type="number"
                    value={config.memoryThreshold}
                    onChange={(e) => handleConfigUpdate('memoryThreshold', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => handleConfigUpdate('enabled', checked)}
                  />
                  <Label>Monitoreo Habilitado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enableAutoRecovery}
                    onCheckedChange={(checked) => handleConfigUpdate('enableAutoRecovery', checked)}
                  />
                  <Label>Auto-recuperación Habilitada</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}