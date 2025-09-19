// ===================================
// PERFORMANCE BUDGET MONITORING
// Sistema de monitoreo de presupuesto de performance
// ===================================

interface PerformanceBudget {
  // Core Web Vitals
  LCP: number; // Largest Contentful Paint (ms)
  FID: number; // First Input Delay (ms)
  CLS: number; // Cumulative Layout Shift (score)
  
  // Loading Performance
  FCP: number; // First Contentful Paint (ms)
  TTI: number; // Time to Interactive (ms)
  
  // Bundle Size
  totalJSSize: number; // Total JavaScript size (KB)
  totalCSSSize: number; // Total CSS size (KB)
  totalImageSize: number; // Total image size (KB)
  
  // Network
  totalRequests: number; // Total number of requests
  totalTransferSize: number; // Total transfer size (KB)
}

// Presupuestos objetivo para Pinteya E-commerce
export const PERFORMANCE_BUDGETS: PerformanceBudget = {
  // Core Web Vitals (valores "Good" según Google)
  LCP: 2500,  // < 2.5s
  FID: 100,   // < 100ms
  CLS: 0.1,   // < 0.1

  // Loading Performance
  FCP: 1800,  // < 1.8s
  TTI: 3800,  // < 3.8s

  // Bundle Size (optimizado para e-commerce)
  totalJSSize: 500,   // < 500KB
  totalCSSSize: 100,  // < 100KB
  totalImageSize: 1000, // < 1MB

  // Network
  totalRequests: 50,    // < 50 requests
  totalTransferSize: 2000, // < 2MB
};

interface PerformanceMetrics {
  timestamp: number;
  url: string;
  metrics: Partial<PerformanceBudget>;
  violations: string[];
  score: number; // 0-100
}

/**
 * Clase para monitorear performance budget
 */
export class PerformanceBudgetMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observer para Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          this.recordMetric('LCP', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // CLS Observer
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // Navigation Observer
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FCP', entry.firstContentfulPaint);
          this.recordMetric('TTI', entry.domInteractive);
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    }
  }

  private recordMetric(type: keyof PerformanceBudget, value: number) {
    const currentUrl = window.location.pathname;
    const timestamp = Date.now();

    // Buscar métricas existentes para esta URL
    let existingMetrics = this.metrics.find(m => 
      m.url === currentUrl && 
      timestamp - m.timestamp < 5000 // Agrupar métricas de los últimos 5 segundos
    );

    if (!existingMetrics) {
      existingMetrics = {
        timestamp,
        url: currentUrl,
        metrics: {},
        violations: [],
        score: 0,
      };
      this.metrics.push(existingMetrics);
    }

    existingMetrics.metrics[type] = value;
    this.checkViolations(existingMetrics);
    this.calculateScore(existingMetrics);
  }

  private checkViolations(metrics: PerformanceMetrics) {
    metrics.violations = [];

    Object.entries(metrics.metrics).forEach(([key, value]) => {
      const budgetKey = key as keyof PerformanceBudget;
      const budget = PERFORMANCE_BUDGETS[budgetKey];
      
      if (value !== undefined && value > budget) {
        const violation = `${key}: ${value.toFixed(2)} exceeds budget of ${budget}`;
        metrics.violations.push(violation);
      }
    });
  }

  private calculateScore(metrics: PerformanceMetrics): void {
    const weights = {
      LCP: 25,
      FID: 25,
      CLS: 25,
      FCP: 10,
      TTI: 10,
      totalJSSize: 3,
      totalCSSSize: 1,
      totalImageSize: 1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(metrics.metrics).forEach(([key, value]) => {
      const budgetKey = key as keyof typeof weights;
      const weight = weights[budgetKey];
      
      if (weight && value !== undefined) {
        const budget = PERFORMANCE_BUDGETS[budgetKey as keyof PerformanceBudget];
        const score = Math.max(0, Math.min(100, 100 - ((value - budget) / budget) * 100));
        
        totalScore += score * weight;
        totalWeight += weight;
      }
    });

    metrics.score = totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Obtener métricas actuales
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    const currentUrl = window.location.pathname;
    return this.metrics
      .filter(m => m.url === currentUrl)
      .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
  }

  /**
   * Obtener todas las métricas
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Obtener violaciones actuales
   */
  getCurrentViolations(): string[] {
    const current = this.getCurrentMetrics();
    return current ? current.violations : [];
  }

  /**
   * Obtener score actual
   */
  getCurrentScore(): number {
    const current = this.getCurrentMetrics();
    return current ? current.score : 0;
  }

  /**
   * Verificar si se cumple el presupuesto
   */
  isWithinBudget(): boolean {
    const violations = this.getCurrentViolations();
    return violations.length === 0;
  }

  /**
   * Generar reporte de performance
   */
  generateReport(): {
    summary: {
      score: number;
      violations: number;
      withinBudget: boolean;
    };
    metrics: PerformanceMetrics | null;
    recommendations: string[];
  } {
    const current = this.getCurrentMetrics();
    const violations = this.getCurrentViolations();
    
    const recommendations: string[] = [];
    
    if (current) {
      // Generar recomendaciones basadas en violaciones
      violations.forEach(violation => {
        if (violation.includes('LCP')) {
          recommendations.push('Optimizar imágenes y lazy loading para mejorar LCP');
        }
        if (violation.includes('FID')) {
          recommendations.push('Reducir JavaScript blocking y optimizar event handlers');
        }
        if (violation.includes('CLS')) {
          recommendations.push('Definir dimensiones de imágenes y evitar content shifts');
        }
        if (violation.includes('totalJSSize')) {
          recommendations.push('Implementar code splitting y tree shaking');
        }
      });
    }

    return {
      summary: {
        score: this.getCurrentScore(),
        violations: violations.length,
        withinBudget: this.isWithinBudget(),
      },
      metrics: current,
      recommendations,
    };
  }

  /**
   * Limpiar observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Instancia global del monitor
let globalMonitor: PerformanceBudgetMonitor | null = null;

/**
 * Hook para usar el monitor de performance budget
 */
export const usePerformanceBudget = () => {
  if (typeof window === 'undefined') {
    return {
      monitor: null,
      getCurrentMetrics: () => null,
      getCurrentScore: () => 0,
      getCurrentViolations: () => [],
      isWithinBudget: () => true,
      generateReport: () => ({
        summary: { score: 0, violations: 0, withinBudget: true },
        metrics: null,
        recommendations: [],
      }),
    };
  }

  if (!globalMonitor) {
    globalMonitor = new PerformanceBudgetMonitor();
  }

  return {
    monitor: globalMonitor,
    getCurrentMetrics: () => globalMonitor!.getCurrentMetrics(),
    getCurrentScore: () => globalMonitor!.getCurrentScore(),
    getCurrentViolations: () => globalMonitor!.getCurrentViolations(),
    isWithinBudget: () => globalMonitor!.isWithinBudget(),
    generateReport: () => globalMonitor!.generateReport(),
  };
};

export default PerformanceBudgetMonitor;









