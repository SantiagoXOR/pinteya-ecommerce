// ===================================
// PERFORMANCE TRACKER COMPONENT
// Componente para tracking automático de performance
// ===================================

'use client';

import { useEffect } from 'react';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';

interface PerformanceTrackerProps {
  enabled?: boolean;
  endpoint?: string;
}

export const PerformanceTracker: React.FC<PerformanceTrackerProps> = ({
  enabled = true,
  endpoint = '/api/admin/performance/metrics'
}) => {
  const { trackBundleSize, getCurrentMetrics, isEnabled } = usePerformanceTracking({
    enabled,
    endpoint,
    batchSize: 3, // Reducir batch size para evitar sobrecarga
    flushInterval: 45000, // Aumentar intervalo a 45 segundos
  });

  useEffect(() => {
    if (!isEnabled) return;

    // Solo ejecutar en desarrollo para evitar spam en producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (!isDevelopment) return;

    // Trackear bundle size al cargar (con delay mayor)
    const timer = setTimeout(() => {
      try {
        trackBundleSize();
      } catch (error) {
        console.warn('Error tracking bundle size:', error);
      }
    }, 3000);

    // Trackear métricas iniciales (sin log en consola)
    const initialTimer = setTimeout(() => {
      try {
        const metrics = getCurrentMetrics();
        // Remover log de consola para evitar spam
        if (metrics && process.env.NODE_ENV === 'development') {
          // Solo log en desarrollo y si hay métricas válidas
          const hasValidMetrics = Object.values(metrics).some(value => 
            value !== undefined && value !== null && value > 0
          );
          if (hasValidMetrics) {
            console.debug('📊 Performance metrics captured:', metrics);
          }
        }
      } catch (error) {
        console.warn('Error getting current metrics:', error);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(initialTimer);
    };
  }, [isEnabled, trackBundleSize, getCurrentMetrics]);

  // Este componente no renderiza nada visible
  return null;
};

export default PerformanceTracker;
