// ===================================
// PINTEYA E-COMMERCE - LAZY ADMIN DASHBOARD
// Componente con lazy loading para el dashboard principal de admin
// ===================================

"use client";

import React, { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Settings,
  Monitor,
  Truck,
  AlertTriangle
} from 'lucide-react';

// ===================================
// LAZY IMPORTS
// ===================================

// Lazy loading del dashboard principal
const AdminDashboard = lazy(() => import('@/app/admin/page'));

// Lazy loading de componentes pesados
const MonitoringEnterprise = lazy(() => import('@/app/admin/monitoring/enterprise/page'));
const LogisticsDashboard = lazy(() => import('@/app/admin/logistics/page'));

// ===================================
// SKELETON COMPONENTS
// ===================================

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MonitoringSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LogisticsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
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

      {/* Map and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===================================
// ERROR BOUNDARY
// ===================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyLoadErrorBoundary extends React.Component<
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
    console.error('Lazy loading error:', error, errorInfo);
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
                No se pudo cargar el componente. Por favor, recarga la página.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Recargar Página
              </button>
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

export function LazyAdminDashboard() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <LazyLoadErrorBoundary>
        <AdminDashboard />
      </LazyLoadErrorBoundary>
    </Suspense>
  );
}

export function LazyMonitoringEnterprise() {
  return (
    <Suspense fallback={<MonitoringSkeleton />}>
      <LazyLoadErrorBoundary>
        <MonitoringEnterprise />
      </LazyLoadErrorBoundary>
    </Suspense>
  );
}

export function LazyLogisticsDashboard() {
  return (
    <Suspense fallback={<LogisticsSkeleton />}>
      <LazyLoadErrorBoundary>
        <LogisticsDashboard />
      </LazyLoadErrorBoundary>
    </Suspense>
  );
}

// ===================================
// PRELOADING HOOKS
// ===================================

export function usePreloadAdminComponents() {
  const preloadAdmin = React.useCallback(() => {
    import('@/app/admin/page');
  }, []);

  const preloadMonitoring = React.useCallback(() => {
    import('@/app/admin/monitoring/enterprise/page');
  }, []);

  const preloadLogistics = React.useCallback(() => {
    import('@/app/admin/logistics/page');
  }, []);

  return {
    preloadAdmin,
    preloadMonitoring,
    preloadLogistics
  };
}

// ===================================
// PREFETCH COMPONENT
// ===================================

export function AdminComponentsPrefetch() {
  const { preloadAdmin, preloadMonitoring, preloadLogistics } = usePreloadAdminComponents();

  React.useEffect(() => {
    // Precargar componentes después de un delay
    const timer = setTimeout(() => {
      preloadAdmin();
      preloadMonitoring();
      preloadLogistics();
    }, 2000);

    return () => clearTimeout(timer);
  }, [preloadAdmin, preloadMonitoring, preloadLogistics]);

  return null;
}









