// ===================================
// PINTEYA E-COMMERCE - API MONITORING SYSTEM
// Sistema de monitoreo para detectar problemas de renderizado y API
// ===================================

interface ApiMonitoringEvent {
  timestamp: string;
  endpoint: string;
  expectedCount: number;
  actualCount: number;
  discrepancy: number;
  userAgent: string;
  sessionId: string;
}

interface RenderingIssue {
  timestamp: string;
  component: string;
  expectedItems: number;
  renderedItems: number;
  filterCriteria?: Record<string, unknown>;
  errorDetails?: string;
}

class ApiMonitoringService {
  private static instance: ApiMonitoringService;
  private events: ApiMonitoringEvent[] = [];
  private renderingIssues: RenderingIssue[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): ApiMonitoringService {
    if (!ApiMonitoringService.instance) {
      ApiMonitoringService.instance = new ApiMonitoringService();
    }
    return ApiMonitoringService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Registra una discrepancia entre datos de API y renderizado
   */
  recordApiDiscrepancy(
    endpoint: string,
    expectedCount: number,
    actualCount: number
  ): void {
    const event: ApiMonitoringEvent = {
      timestamp: new Date().toISOString(),
      endpoint,
      expectedCount,
      actualCount,
      discrepancy: expectedCount - actualCount,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.events.push(event);
    
    // Log crítico si hay discrepancia significativa
    if (event.discrepancy > 0) {
      console.error('🚨 API Discrepancy Detected:', {
        endpoint: event.endpoint,
        expected: event.expectedCount,
        actual: event.actualCount,
        lost: event.discrepancy,
        percentage: ((event.discrepancy / event.expectedCount) * 100).toFixed(2) + '%'
      });
      
      // Enviar alerta si la discrepancia es mayor al 20%
      if (event.discrepancy / event.expectedCount > 0.2) {
        this.sendCriticalAlert(event);
      }
    }

    // Mantener solo los últimos 100 eventos
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  /**
   * Registra un problema de renderizado
   */
  recordRenderingIssue(
    component: string,
    expectedItems: number,
    renderedItems: number,
    filterCriteria?: Record<string, unknown>,
    errorDetails?: string
  ): void {
    const issue: RenderingIssue = {
      timestamp: new Date().toISOString(),
      component,
      expectedItems,
      renderedItems,
      filterCriteria,
      errorDetails
    };

    this.renderingIssues.push(issue);

    console.warn('⚠️ Rendering Issue Detected:', {
      component: issue.component,
      expected: issue.expectedItems,
      rendered: issue.renderedItems,
      filters: issue.filterCriteria,
      error: issue.errorDetails
    });

    // Mantener solo los últimos 50 problemas
    if (this.renderingIssues.length > 50) {
      this.renderingIssues = this.renderingIssues.slice(-50);
    }
  }

  /**
   * Envía una alerta crítica (en producción se enviaría a un servicio de monitoreo)
   */
  private sendCriticalAlert(event: ApiMonitoringEvent): void {
    // En desarrollo, solo log
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 CRITICAL ALERT:', {
        message: 'Significant data loss detected',
        event,
        recommendation: 'Check API validation logic and data filtering'
      });
      return;
    }

    // En producción, enviar a servicio de monitoreo
    // fetch('/api/monitoring/alerts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ type: 'api_discrepancy', event })
    // }).catch(console.error);
  }

  /**
   * Obtiene estadísticas de monitoreo
   */
  getMonitoringStats(): {
    totalEvents: number;
    totalIssues: number;
    criticalEvents: number;
    averageDiscrepancy: number;
    recentEvents: ApiMonitoringEvent[];
    recentIssues: RenderingIssue[];
  } {
    const criticalEvents = this.events.filter(e => e.discrepancy > 0).length;
    const totalDiscrepancy = this.events.reduce((sum, e) => sum + Math.abs(e.discrepancy), 0);
    const averageDiscrepancy = this.events.length > 0 ? totalDiscrepancy / this.events.length : 0;

    return {
      totalEvents: this.events.length,
      totalIssues: this.renderingIssues.length,
      criticalEvents,
      averageDiscrepancy,
      recentEvents: this.events.slice(-10),
      recentIssues: this.renderingIssues.slice(-10)
    };
  }

  /**
   * Limpia los datos de monitoreo
   */
  clearMonitoringData(): void {
    this.events = [];
    this.renderingIssues = [];
    console.log('🧹 Monitoring data cleared');
  }

  /**
   * Exporta datos de monitoreo para análisis
   */
  exportMonitoringData(): string {
    const data = {
      sessionId: this.sessionId,
      exportTimestamp: new Date().toISOString(),
      events: this.events,
      renderingIssues: this.renderingIssues,
      stats: this.getMonitoringStats()
    };

    return JSON.stringify(data, null, 2);
  }
}

// Instancia singleton
export const apiMonitoring = ApiMonitoringService.getInstance();

// Hook para usar el monitoreo en componentes React
export function useApiMonitoring() {
  return {
    recordDiscrepancy: apiMonitoring.recordApiDiscrepancy.bind(apiMonitoring),
    recordRenderingIssue: apiMonitoring.recordRenderingIssue.bind(apiMonitoring),
    getStats: apiMonitoring.getMonitoringStats.bind(apiMonitoring),
    clearData: apiMonitoring.clearMonitoringData.bind(apiMonitoring),
    exportData: apiMonitoring.exportMonitoringData.bind(apiMonitoring)
  };
}

// Utilidad para detectar automáticamente discrepancias
export function detectApiDiscrepancy(
  endpoint: string,
  apiResponse: { total?: number; count?: number; length?: number },
  renderedItems: unknown[]
): void {
  const expectedCount = apiResponse.total || apiResponse.count || apiResponse.length || 0;
  const actualCount = Array.isArray(renderedItems) ? renderedItems.length : 0;
  
  if (expectedCount !== actualCount) {
    apiMonitoring.recordApiDiscrepancy(endpoint, expectedCount, actualCount);
  }
}

// Decorator para monitorear automáticamente funciones de API
export function monitorApiCall(endpoint: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        
        // Si el resultado tiene datos paginados, verificar discrepancias
        if (result && typeof result === 'object') {
          if ('data' in result && 'pagination' in result.data) {
            const { data } = result;
            detectApiDiscrepancy(endpoint, data.pagination, data.orders || data.items || []);
          }
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`API call failed for ${endpoint} after ${duration}ms:`, error);
        throw error;
      }
    };
    
    return descriptor;
  };
}