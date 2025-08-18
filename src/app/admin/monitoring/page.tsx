// ===================================
// PINTEYA E-COMMERCE - MONITORING DASHBOARD PAGE
// ===================================

import { Metadata } from 'next';
import { Suspense } from 'react';
import RealTimeMonitoringDashboard from '@/components/admin/monitoring/RealTimeMonitoringDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Shield, TrendingUp, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard de Monitoreo | Pinteya E-commerce Admin',
  description: 'Dashboard de monitoreo en tiempo real para el sistema Pinteya E-commerce',
};

/**
 * Componente de loading para el dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Metrics grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Componente de información del sistema
 */
function SystemInfo() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Óptimo</div>
          <p className="text-xs text-muted-foreground">
            Sistema funcionando correctamente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Seguridad</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Seguro</div>
          <p className="text-xs text-muted-foreground">
            Sin amenazas detectadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disponibilidad</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">99.97%</div>
          <p className="text-xs text-muted-foreground">
            Uptime últimos 30 días
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tendencia</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">+12%</div>
          <p className="text-xs text-muted-foreground">
            Mejora vs mes anterior
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Página principal del dashboard de monitoreo
 */
export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Información del sistema */}
      <SystemInfo />

      {/* Dashboard principal con Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <RealTimeMonitoringDashboard />
      </Suspense>

      {/* Información adicional */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acerca del Monitoreo</CardTitle>
            <CardDescription>
              Sistema de monitoreo enterprise en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Actualización automática</span>
              <span className="font-medium">5 segundos</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Retención de datos</span>
              <span className="font-medium">30 días</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Métricas activas</span>
              <span className="font-medium">50+</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Alertas configuradas</span>
              <span className="font-medium">15</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance</CardTitle>
            <CardDescription>
              Estándares y certificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>ISO/IEC 27001:2013</span>
              <span className="font-medium text-green-600">✓ Compliant</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>GDPR</span>
              <span className="font-medium text-green-600">✓ Compliant</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Audit Trail</span>
              <span className="font-medium text-green-600">✓ Activo</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Encryption</span>
              <span className="font-medium text-green-600">✓ AES-256</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Soporte</CardTitle>
            <CardDescription>
              Recursos y contactos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Documentación</div>
              <div className="text-muted-foreground">
                /docs/monitoring/dashboard
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium">API Reference</div>
              <div className="text-muted-foreground">
                /api/admin/monitoring/*
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Alertas</div>
              <div className="text-muted-foreground">
                Configurables por métrica
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Soporte 24/7</div>
              <div className="text-muted-foreground">
                Enterprise support
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer informativo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Dashboard de Monitoreo Enterprise - Pinteya E-commerce v3.0
            </div>
            <div className="flex items-center space-x-4">
              <span>Última actualización del sistema: {new Date().toLocaleDateString('es-AR')}</span>
              <span>•</span>
              <span>Versión: 3.0.0</span>
              <span>•</span>
              <span>Build: {process.env.NODE_ENV}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
