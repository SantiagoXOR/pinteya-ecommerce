// ===================================
// PINTEYA E-COMMERCE - ENTERPRISE MONITORING DASHBOARD
// Dashboard enterprise para monitoreo de errores, performance y alertas
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Eye,
  Bell,
  BellOff,
  RefreshCw,
} from '@/lib/optimized-imports'

// Importar monitoring manager
import EnterpriseMonitoringManager from '@/lib/monitoring/enterprise-monitoring-manager'
import type {
  ErrorEvent,
  PerformanceMetrics,
  AlertEvent,
} from '@/lib/monitoring/enterprise-monitoring-manager'

// ===================================
// INTERFACES
// ===================================

interface MonitoringStats {
  errors: {
    total: number
    critical: number
    warning: number
  }
  performance: {
    averageLoadTime: number
    averageMemoryUsage: number
  }
  alerts: {
    active: number
    critical: number
    unacknowledged: number
  }
  system: {
    uptime: number
    sessionId: string
  }
}

// ===================================
// ENTERPRISE MONITORING DASHBOARD COMPONENT
// ===================================

export default function EnterpriseMonitoringDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<MonitoringStats>({
    errors: { total: 0, critical: 0, warning: 0 },
    performance: { averageLoadTime: 0, averageMemoryUsage: 0 },
    alerts: { active: 0, critical: 0, unacknowledged: 0 },
    system: { uptime: 0, sessionId: '' },
  })
  const [errors, setErrors] = useState<ErrorEvent[]>([])
  const [alerts, setAlerts] = useState<AlertEvent[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([])

  // Initialize monitoring manager
  const [monitoringManager] = useState(() => {
    try {
      return EnterpriseMonitoringManager.getInstance({
        errorTracking: {
          enabled: true,
          sampleRate: 1.0,
          ignoreErrors: ['ResizeObserver loop limit exceeded'],
          maxBreadcrumbs: 50,
        },
        performance: {
          enabled: true,
          sampleRate: 0.1,
          thresholds: {
            lcp: 2500,
            fid: 100,
            cls: 0.1,
            loadTime: 3000,
          },
        },
        alerts: {
          enabled: true,
          channels: {
            email: ['admin@pinteya.com'],
            slack: process.env.NEXT_PUBLIC_SLACK_WEBHOOK,
          },
        },
      })
    } catch (error) {
      console.error('Failed to initialize monitoring manager:', error)
      return null
    }
  })

  // ===================================
  // EFFECTS
  // ===================================

  useEffect(() => {
    loadMonitoringData()

    // Refresh data every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000)

    return () => clearInterval(interval)
  }, [])

  // ===================================
  // HANDLERS
  // ===================================

  const loadMonitoringData = () => {
    if (!monitoringManager) {
      return
    }

    try {
      // Get monitoring summary
      const summary = monitoringManager.getMonitoringSummary()
      setStats(summary)

      // Get recent errors
      const recentErrors = monitoringManager.getErrors({
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date(),
        },
        limit: 50,
      })
      setErrors(recentErrors)

      // Get active alerts
      const activeAlerts = monitoringManager.getActiveAlerts()
      setAlerts(activeAlerts)

      // Get performance metrics
      const metrics = monitoringManager.getPerformanceMetrics({
        start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        end: new Date(),
      })
      setPerformanceMetrics(metrics)
    } catch (error) {
      console.error('Failed to load monitoring data:', error)
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
    loadMonitoringData()
    setIsLoading(false)
  }

  const acknowledgeAlert = (alertId: string) => {
    if (!monitoringManager) {
      return
    }

    const success = monitoringManager.acknowledgeAlert(alertId)
    if (success) {
      loadMonitoringData()
    }
  }

  const resolveAlert = (alertId: string) => {
    if (!monitoringManager) {
      return
    }

    const success = monitoringManager.resolveAlert(alertId)
    if (success) {
      loadMonitoringData()
    }
  }

  const simulateError = () => {
    if (!monitoringManager) {
      return
    }

    monitoringManager.captureError(
      new Error('Test error from enterprise monitoring dashboard'),
      'warning',
      { component: 'EnterpriseMonitoringDashboard', action: 'simulate_error' },
      ['test', 'enterprise', 'dashboard']
    )

    setTimeout(loadMonitoringData, 1000)
  }

  const simulatePerformanceIssue = () => {
    if (!monitoringManager) {
      return
    }

    monitoringManager.recordMetric('load_time', 5000, {
      component: 'EnterpriseMonitoringDashboard',
      simulated: true,
    })

    setTimeout(loadMonitoringData, 1000)
  }

  const simulateCriticalAlert = () => {
    if (!monitoringManager) {
      return
    }

    monitoringManager.captureError(
      new Error('Critical system failure simulation'),
      'critical',
      { component: 'SystemCore', action: 'critical_failure' },
      ['critical', 'system', 'simulation']
    )

    setTimeout(loadMonitoringData, 1000)
  }

  // ===================================
  // RENDER HELPERS
  // ===================================

  const renderStatsCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    trend?: number,
    status?: 'good' | 'warning' | 'critical'
  ) => {
    const getStatusColor = () => {
      switch (status) {
        case 'good':
          return 'text-green-600'
        case 'warning':
          return 'text-yellow-600'
        case 'critical':
          return 'text-red-600'
        default:
          return 'text-muted-foreground'
      }
    }

    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>{title}</p>
              <p className={`text-2xl font-bold ${getStatusColor()}`}>{value}</p>
              {trend !== undefined && (
                <p
                  className={`text-xs flex items-center gap-1 mt-1 ${
                    trend >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {trend >= 0 ? (
                    <TrendingUp className='h-3 w-3' />
                  ) : (
                    <TrendingDown className='h-3 w-3' />
                  )}
                  {Math.abs(trend).toFixed(1)}%
                </p>
              )}
            </div>
            <div className={`h-8 w-8 ${getStatusColor()}`}>{icon}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderErrorCard = (error: ErrorEvent) => (
    <Card key={error.id} className='mb-4'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg flex items-center gap-2'>
            {error.level === 'critical' && <XCircle className='h-5 w-5 text-red-500' />}
            {error.level === 'error' && <AlertTriangle className='h-5 w-5 text-orange-500' />}
            {error.level === 'warning' && <AlertTriangle className='h-5 w-5 text-yellow-500' />}
            {error.level === 'info' && <CheckCircle className='h-5 w-5 text-blue-500' />}
            {error.message}
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Badge variant={error.level === 'critical' ? 'destructive' : 'secondary'}>
              {error.level}
            </Badge>
            {error.count > 1 && <Badge variant='outline'>{error.count}x</Badge>}
          </div>
        </div>
        <CardDescription>
          {error.context.component && `Component: ${error.context.component} | `}
          {new Date(error.timestamp).toLocaleString()}
        </CardDescription>
      </CardHeader>
      {error.stack && (
        <CardContent>
          <details className='text-xs'>
            <summary className='cursor-pointer font-medium mb-2'>Stack Trace</summary>
            <pre className='bg-gray-100 p-3 rounded text-xs overflow-x-auto'>{error.stack}</pre>
          </details>
        </CardContent>
      )}
    </Card>
  )

  const renderAlertCard = (alert: AlertEvent) => (
    <Card key={alert.id} className='mb-4'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg flex items-center gap-2'>
            {alert.severity === 'critical' && <XCircle className='h-5 w-5 text-red-500' />}
            {alert.severity === 'high' && <AlertTriangle className='h-5 w-5 text-orange-500' />}
            {alert.severity === 'medium' && <AlertTriangle className='h-5 w-5 text-yellow-500' />}
            {alert.severity === 'low' && <CheckCircle className='h-5 w-5 text-blue-500' />}
            {alert.message}
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
              {alert.severity}
            </Badge>
            {alert.acknowledged && <Badge variant='outline'>Acknowledged</Badge>}
          </div>
        </div>
        <CardDescription>
          Value: {alert.value} | Threshold: {alert.threshold} |
          {new Date(alert.timestamp).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex gap-2'>
          {!alert.acknowledged && (
            <Button size='sm' variant='outline' onClick={() => acknowledgeAlert(alert.id)}>
              <Bell className='h-4 w-4 mr-2' />
              Acknowledge
            </Button>
          )}
          {!alert.resolvedAt && (
            <Button size='sm' variant='outline' onClick={() => resolveAlert(alert.id)}>
              <CheckCircle className='h-4 w-4 mr-2' />
              Resolve
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // ===================================
  // RENDER
  // ===================================

  if (!monitoringManager) {
    return (
      <div className='container mx-auto p-6'>
        <Card>
          <CardContent className='p-12 text-center'>
            <XCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
            <h3 className='text-lg font-medium mb-2'>Monitoring Unavailable</h3>
            <p className='text-muted-foreground'>
              Failed to initialize monitoring system. Please check configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Enterprise Monitoring Dashboard</h1>
          <p className='text-muted-foreground'>
            Monitoreo enterprise de errores, performance y alertas en tiempo real
          </p>
        </div>

        <div className='flex gap-2'>
          <Button onClick={simulateError} variant='outline' size='sm'>
            <AlertTriangle className='h-4 w-4 mr-2' />
            Simulate Error
          </Button>
          <Button onClick={simulatePerformanceIssue} variant='outline' size='sm'>
            <Zap className='h-4 w-4 mr-2' />
            Simulate Performance Issue
          </Button>
          <Button onClick={simulateCriticalAlert} variant='outline' size='sm'>
            <XCircle className='h-4 w-4 mr-2' />
            Simulate Critical Alert
          </Button>
          <Button onClick={refreshData} disabled={isLoading} variant='outline'>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {renderStatsCard(
          'Total Errors (24h)',
          stats.errors.total,
          <AlertTriangle className='h-8 w-8' />,
          -12.5,
          stats.errors.critical > 0 ? 'critical' : stats.errors.warning > 0 ? 'warning' : 'good'
        )}
        {renderStatsCard(
          'Active Alerts',
          stats.alerts.active,
          <Bell className='h-8 w-8' />,
          undefined,
          stats.alerts.critical > 0 ? 'critical' : stats.alerts.active > 0 ? 'warning' : 'good'
        )}
        {renderStatsCard(
          'Avg Load Time',
          `${stats.performance.averageLoadTime.toFixed(0)}ms`,
          <Clock className='h-8 w-8' />,
          8.3,
          stats.performance.averageLoadTime > 3000
            ? 'critical'
            : stats.performance.averageLoadTime > 1500
              ? 'warning'
              : 'good'
        )}
        {renderStatsCard(
          'Memory Usage',
          `${stats.performance.averageMemoryUsage.toFixed(1)}MB`,
          <Activity className='h-8 w-8' />,
          -5.1,
          stats.performance.averageMemoryUsage > 100
            ? 'critical'
            : stats.performance.averageMemoryUsage > 50
              ? 'warning'
              : 'good'
        )}
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Enterprise System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Uptime</p>
              <p className='text-lg font-semibold'>
                {Math.floor(stats.system.uptime / (1000 * 60 * 60))}h{' '}
                {Math.floor((stats.system.uptime % (1000 * 60 * 60)) / (1000 * 60))}m
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Session ID</p>
              <p className='text-lg font-mono text-xs'>{stats.system.sessionId}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Status</p>
              <div className='flex items-center gap-2'>
                <div className='h-2 w-2 bg-green-500 rounded-full'></div>
                <span className='text-lg font-semibold text-green-600'>Operational</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Views */}
      <Tabs defaultValue='alerts' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='alerts'>Active Alerts ({stats.alerts.active})</TabsTrigger>
          <TabsTrigger value='errors'>Recent Errors ({stats.errors.total})</TabsTrigger>
          <TabsTrigger value='performance'>Performance Metrics</TabsTrigger>
          <TabsTrigger value='config'>Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value='alerts' className='space-y-4'>
          {alerts.length > 0 ? (
            <div className='space-y-4'>{alerts.map(renderAlertCard)}</div>
          ) : (
            <Card>
              <CardContent className='p-12 text-center'>
                <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
                <h3 className='text-lg font-medium mb-2'>No Active Alerts</h3>
                <p className='text-muted-foreground'>
                  All enterprise systems are operating normally
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='errors' className='space-y-4'>
          {errors.length > 0 ? (
            <div className='space-y-4'>{errors.map(renderErrorCard)}</div>
          ) : (
            <Card>
              <CardContent className='p-12 text-center'>
                <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
                <h3 className='text-lg font-medium mb-2'>No Recent Errors</h3>
                <p className='text-muted-foreground'>
                  No errors have been captured in the last 24 hours
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='performance' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Last hour metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span>Load Time</span>
                      <span>{stats.performance.averageLoadTime.toFixed(0)}ms</span>
                    </div>
                    <Progress value={Math.min(stats.performance.averageLoadTime / 30, 100)} />
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span>Memory Usage</span>
                      <span>{stats.performance.averageMemoryUsage.toFixed(1)}MB</span>
                    </div>
                    <Progress value={Math.min(stats.performance.averageMemoryUsage, 100)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
                <CardDescription>Performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>LCP (Largest Contentful Paint)</span>
                    <Badge variant='outline'>Good</Badge>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>FID (First Input Delay)</span>
                    <Badge variant='outline'>Good</Badge>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>CLS (Cumulative Layout Shift)</span>
                    <Badge variant='outline'>Good</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='config' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Eye className='h-5 w-5' />
                  Error Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Enabled</span>
                  <Badge variant='default'>Active</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Sample Rate</span>
                  <span className='text-sm'>100%</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Max Breadcrumbs</span>
                  <span className='text-sm'>50</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-5 w-5' />
                  Performance Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Enabled</span>
                  <Badge variant='default'>Active</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Sample Rate</span>
                  <span className='text-sm'>10%</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>LCP Threshold</span>
                  <span className='text-sm'>2.5s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
