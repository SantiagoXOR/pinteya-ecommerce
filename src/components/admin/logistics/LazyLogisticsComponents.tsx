// ===================================
// PINTEYA E-COMMERCE - LAZY LOGISTICS COMPONENTS
// Componentes con lazy loading para gestión de logística
// ===================================

"use client";

import React, { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Map as MapIcon, 
  BarChart3, 
  Package,
  AlertTriangle,
  Loader2,
  Activity,
  Clock
} from 'lucide-react';

// ===================================
// LAZY IMPORTS
// ===================================

// Lazy loading de componentes de logística
const RealTimeDashboard = lazy(() => import('./RealTimeDashboard'));
const LogisticsMap = lazy(() => import('./LogisticsMap'));
const CarrierPerformanceTable = lazy(() => import('./CarrierPerformanceTable'));
const ShipmentsList = lazy(() => import('./ShipmentsList'));
const TrackingTimeline = lazy(() => import('./TrackingTimeline'));
const GeofenceManager = lazy(() => import('./GeofenceManager'));

// ===================================
// SKELETON COMPONENTS
// ===================================

function RealTimeDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="w-5 h-5" />
              Mapa en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LogisticsMapSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapIcon className="w-5 h-5" />
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Skeleton className="h-96 w-full rounded-lg" />
          <div className="absolute top-4 right-4 space-y-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CarrierPerformanceTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance de Couriers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 pb-2 border-b">
            {['Courier', 'Entregas', 'Puntualidad', 'Rating', 'Acciones'].map((header, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ShipmentsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Lista de Envíos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TrackingTimelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timeline de Seguimiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================
// ERROR BOUNDARY
// ===================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LogisticsErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Logistics component lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Error de Carga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                No se pudo cargar el componente de logística. Por favor, intenta nuevamente.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                Recargar
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ===================================
// LAZY COMPONENTS
// ===================================

export function LazyRealTimeDashboard(props: any) {
  return (
    <Suspense fallback={<RealTimeDashboardSkeleton />}>
      <LogisticsErrorBoundary>
        <RealTimeDashboard {...props} />
      </LogisticsErrorBoundary>
    </Suspense>
  );
}

export function LazyLogisticsMap(props: any) {
  return (
    <Suspense fallback={<LogisticsMapSkeleton />}>
      <LogisticsErrorBoundary>
        <LogisticsMap {...props} />
      </LogisticsErrorBoundary>
    </Suspense>
  );
}

export function LazyCarrierPerformanceTable(props: any) {
  return (
    <Suspense fallback={<CarrierPerformanceTableSkeleton />}>
      <LogisticsErrorBoundary>
        <CarrierPerformanceTable {...props} />
      </LogisticsErrorBoundary>
    </Suspense>
  );
}

export function LazyShipmentsList(props: any) {
  return (
    <Suspense fallback={<ShipmentsListSkeleton />}>
      <LogisticsErrorBoundary>
        <ShipmentsList {...props} />
      </LogisticsErrorBoundary>
    </Suspense>
  );
}

export function LazyTrackingTimeline(props: any) {
  return (
    <Suspense fallback={<TrackingTimelineSkeleton />}>
      <LogisticsErrorBoundary>
        <TrackingTimeline {...props} />
      </LogisticsErrorBoundary>
    </Suspense>
  );
}

export function LazyGeofenceManager(props: any) {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <LogisticsErrorBoundary>
        <GeofenceManager {...props} />
      </LogisticsErrorBoundary>
    </Suspense>
  );
}

// ===================================
// PRELOADING HOOKS
// ===================================

export function usePreloadLogisticsComponents() {
  const preloadDashboard = React.useCallback(() => {
    import('./RealTimeDashboard');
  }, []);

  const preloadMap = React.useCallback(() => {
    import('./LogisticsMap');
  }, []);

  const preloadTable = React.useCallback(() => {
    import('./CarrierPerformanceTable');
  }, []);

  const preloadShipments = React.useCallback(() => {
    import('./ShipmentsList');
  }, []);

  return {
    preloadDashboard,
    preloadMap,
    preloadTable,
    preloadShipments
  };
}

// ===================================
// PREFETCH COMPONENT
// ===================================

export function LogisticsComponentsPrefetch() {
  const { preloadDashboard, preloadMap, preloadTable, preloadShipments } = usePreloadLogisticsComponents();

  React.useEffect(() => {
    // Precargar componentes críticos después de un delay
    const timer = setTimeout(() => {
      preloadDashboard();
      preloadShipments();
      // Map y Table se cargan bajo demanda por ser más pesados
    }, 2000);

    return () => clearTimeout(timer);
  }, [preloadDashboard, preloadShipments]);

  return null;
}









