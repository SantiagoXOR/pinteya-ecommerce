// ===================================
// PERFORMANCE BUDGET MONITOR
// ===================================
// Sistema de monitoreo de presupuestos de rendimiento

import { promises as fs } from 'fs';
import path from 'path';

// ===================================
// INTERFACES Y TIPOS
// ===================================

export interface PerformanceBudget {
  name: string;
  type: 'size' | 'count' | 'time';
  threshold: number;
  warning: number;
  unit: 'bytes' | 'kb' | 'mb' | 'ms' | 'count';
  category: 'critical' | 'important' | 'optional';
  description: string;
}

export interface BudgetViolation {
  budget: PerformanceBudget;
  actual: number;
  expected: number;
  severity: 'warning' | 'error';
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface PerformanceReport {
  timestamp: string;
  buildId: string;
  violations: BudgetViolation[];
  metrics: PerformanceMetrics;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trends: PerformanceTrend[];
}

export interface PerformanceMetrics {
  bundleSize: number;
  firstLoadJS: number;
  totalJS: number;
  css: number;
  images: number;
  fonts: number;
  chunkCount: number;
  duplicateModules: number;
  unusedCode: number;
}

export interface PerformanceTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'degrading' | 'stable';
}

// ===================================
// PERFORMANCE BUDGET MONITOR
// ===================================

export class PerformanceBudgetMonitor {
  private static instance: PerformanceBudgetMonitor;
  private budgets: PerformanceBudget[] = [];
  private history: PerformanceReport[] = [];
  private maxHistorySize = 50;

  private constructor() {
    this.initializeDefaultBudgets();
  }

  public static getInstance(): PerformanceBudgetMonitor {
    if (!PerformanceBudgetMonitor.instance) {
      PerformanceBudgetMonitor.instance = new PerformanceBudgetMonitor();
    }
    return PerformanceBudgetMonitor.instance;
  }

  // ===================================
  // CONFIGURACIÓN DE BUDGETS
  // ===================================

  private initializeDefaultBudgets(): void {
    this.budgets = [
      // Budgets de tamaño críticos
      {
        name: 'First Load JS',
        type: 'size',
        threshold: 128 * 1024, // 128KB
        warning: 100 * 1024, // 100KB
        unit: 'bytes',
        category: 'critical',
        description: 'JavaScript crítico que se carga inicialmente'
      },
      {
        name: 'Total Bundle Size',
        type: 'size',
        threshold: 500 * 1024, // 500KB
        warning: 400 * 1024, // 400KB
        unit: 'bytes',
        category: 'critical',
        description: 'Tamaño total de todos los bundles JavaScript'
      },
      {
        name: 'CSS Bundle Size',
        type: 'size',
        threshold: 50 * 1024, // 50KB
        warning: 40 * 1024, // 40KB
        unit: 'bytes',
        category: 'important',
        description: 'Tamaño total de archivos CSS'
      },
      {
        name: 'Image Assets',
        type: 'size',
        threshold: 200 * 1024, // 200KB
        warning: 150 * 1024, // 150KB
        unit: 'bytes',
        category: 'important',
        description: 'Tamaño total de imágenes optimizadas'
      },
      {
        name: 'Font Assets',
        type: 'size',
        threshold: 100 * 1024, // 100KB
        warning: 80 * 1024, // 80KB
        unit: 'bytes',
        category: 'optional',
        description: 'Tamaño total de archivos de fuentes'
      },

      // Budgets de conteo
      {
        name: 'Chunk Count',
        type: 'count',
        threshold: 20,
        warning: 15,
        unit: 'count',
        category: 'important',
        description: 'Número total de chunks generados'
      },
      {
        name: 'Duplicate Modules',
        type: 'count',
        threshold: 5,
        warning: 3,
        unit: 'count',
        category: 'important',
        description: 'Módulos duplicados entre chunks'
      },

      // Budgets de tiempo (para futuras implementaciones)
      {
        name: 'Build Time',
        type: 'time',
        threshold: 60000, // 60 segundos
        warning: 45000, // 45 segundos
        unit: 'ms',
        category: 'optional',
        description: 'Tiempo total de build'
      }
    ];
  }

  public addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget);
  }

  public updateBudget(name: string, updates: Partial<PerformanceBudget>): void {
    const index = this.budgets.findIndex(b => b.name === name);
    if (index !== -1) {
      this.budgets[index] = { ...this.budgets[index], ...updates };
    }
  }

  public removeBudget(name: string): void {
    this.budgets = this.budgets.filter(b => b.name !== name);
  }

  public getBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  // ===================================
  // ANÁLISIS DE PERFORMANCE
  // ===================================

  public async analyzePerformance(buildPath: string = '.next'): Promise<PerformanceReport> {
    const metrics = await this.collectMetrics(buildPath);
    const violations = this.checkBudgetViolations(metrics);
    const score = this.calculatePerformanceScore(violations, metrics);
    const grade = this.getPerformanceGrade(score);
    const trends = this.calculateTrends(metrics);

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      buildId: this.generateBuildId(),
      violations,
      metrics,
      score,
      grade,
      trends
    };

    this.addToHistory(report);
    return report;
  }

  private async collectMetrics(buildPath: string): Promise<PerformanceMetrics> {
    try {
      // En una implementación real, esto analizaría los archivos del build
      // Por ahora, simulamos métricas realistas
      const staticPath = path.join(buildPath, 'static');
      
      return {
        bundleSize: 450 * 1024, // 450KB
        firstLoadJS: 95 * 1024, // 95KB
        totalJS: 380 * 1024, // 380KB
        css: 35 * 1024, // 35KB
        images: 120 * 1024, // 120KB
        fonts: 45 * 1024, // 45KB
        chunkCount: 12,
        duplicateModules: 2,
        unusedCode: 25 * 1024 // 25KB
      };
    } catch (error) {
      console.warn('Could not collect real metrics, using mock data');
      return this.getMockMetrics();
    }
  }

  private getMockMetrics(): PerformanceMetrics {
    return {
      bundleSize: 420 * 1024,
      firstLoadJS: 88 * 1024,
      totalJS: 350 * 1024,
      css: 32 * 1024,
      images: 110 * 1024,
      fonts: 40 * 1024,
      chunkCount: 10,
      duplicateModules: 1,
      unusedCode: 20 * 1024
    };
  }

  private checkBudgetViolations(metrics: PerformanceMetrics): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    for (const budget of this.budgets) {
      const actual = this.getMetricValue(metrics, budget.name);
      if (actual === null) {continue;}

      let violation: BudgetViolation | null = null;

      if (actual > budget.threshold) {
        violation = {
          budget,
          actual,
          expected: budget.threshold,
          severity: 'error',
          impact: this.calculateImpact(budget, actual),
          recommendation: this.generateRecommendation(budget, actual)
        };
      } else if (actual > budget.warning) {
        violation = {
          budget,
          actual,
          expected: budget.warning,
          severity: 'warning',
          impact: this.calculateImpact(budget, actual),
          recommendation: this.generateRecommendation(budget, actual)
        };
      }

      if (violation) {
        violations.push(violation);
      }
    }

    return violations.sort((a, b) => {
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  private getMetricValue(metrics: PerformanceMetrics, budgetName: string): number | null {
    const metricMap: Record<string, keyof PerformanceMetrics> = {
      'First Load JS': 'firstLoadJS',
      'Total Bundle Size': 'bundleSize',
      'CSS Bundle Size': 'css',
      'Image Assets': 'images',
      'Font Assets': 'fonts',
      'Chunk Count': 'chunkCount',
      'Duplicate Modules': 'duplicateModules'
    };

    const metricKey = metricMap[budgetName];
    return metricKey ? metrics[metricKey] : null;
  }

  private calculateImpact(budget: PerformanceBudget, actual: number): 'low' | 'medium' | 'high' | 'critical' {
    const excess = actual - budget.threshold;
    const excessPercent = (excess / budget.threshold) * 100;

    if (budget.category === 'critical') {
      if (excessPercent > 50) {return 'critical';}
      if (excessPercent > 25) {return 'high';}
      if (excessPercent > 10) {return 'medium';}
      return 'low';
    }

    if (budget.category === 'important') {
      if (excessPercent > 75) {return 'high';}
      if (excessPercent > 50) {return 'medium';}
      return 'low';
    }

    return excessPercent > 100 ? 'medium' : 'low';
  }

  private generateRecommendation(budget: PerformanceBudget, actual: number): string {
    const excess = actual - budget.threshold;
    const excessKB = Math.round(excess / 1024);

    const recommendations: Record<string, string> = {
      'First Load JS': `Reducir ${excessKB}KB implementando lazy loading para componentes no críticos`,
      'Total Bundle Size': `Optimizar bundles dividiendo en chunks más pequeños (${excessKB}KB de exceso)`,
      'CSS Bundle Size': `Eliminar CSS no utilizado y optimizar imports (${excessKB}KB de exceso)`,
      'Image Assets': `Optimizar imágenes con formatos modernos (WebP/AVIF) y compresión`,
      'Font Assets': `Usar font-display: swap y preload para fuentes críticas`,
      'Chunk Count': `Consolidar chunks pequeños para reducir overhead HTTP`,
      'Duplicate Modules': `Configurar splitChunks para evitar duplicación de módulos`
    };

    return recommendations[budget.name] || `Optimizar ${budget.name} para cumplir con el presupuesto`;
  }

  private calculatePerformanceScore(violations: BudgetViolation[], metrics: PerformanceMetrics): number {
    let score = 100;

    for (const violation of violations) {
      const penalty = this.calculatePenalty(violation);
      score -= penalty;
    }

    // Bonus por métricas especialmente buenas
    if (metrics.firstLoadJS < 80 * 1024) {score += 5;} // Bonus por First Load JS < 80KB
    if (metrics.duplicateModules === 0) {score += 3;} // Bonus por no duplicados
    if (metrics.chunkCount <= 8) {score += 2;} // Bonus por chunks optimizados

    return Math.max(0, Math.min(100, score));
  }

  private calculatePenalty(violation: BudgetViolation): number {
    const basePenalty = violation.severity === 'error' ? 15 : 8;
    const impactMultiplier = {
      critical: 2.0,
      high: 1.5,
      medium: 1.2,
      low: 1.0
    };

    return basePenalty * impactMultiplier[violation.impact];
  }

  private getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) {return 'A';}
    if (score >= 80) {return 'B';}
    if (score >= 70) {return 'C';}
    if (score >= 60) {return 'D';}
    return 'F';
  }

  private calculateTrends(currentMetrics: PerformanceMetrics): PerformanceTrend[] {
    if (this.history.length === 0) {return [];}

    const previousReport = this.history[this.history.length - 1];
    const trends: PerformanceTrend[] = [];

    const metricKeys: (keyof PerformanceMetrics)[] = [
      'bundleSize', 'firstLoadJS', 'totalJS', 'css', 'chunkCount'
    ];

    for (const key of metricKeys) {
      const current = currentMetrics[key];
      const previous = previousReport.metrics[key];
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : 0;

      let trend: 'improving' | 'degrading' | 'stable' = 'stable';
      if (Math.abs(changePercent) > 5) {
        trend = change < 0 ? 'improving' : 'degrading';
      }

      trends.push({
        metric: key,
        current,
        previous,
        change,
        changePercent,
        trend
      });
    }

    return trends;
  }

  // ===================================
  // GESTIÓN DE HISTORIAL
  // ===================================

  private addToHistory(report: PerformanceReport): void {
    this.history.push(report);
    
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  public getHistory(): PerformanceReport[] {
    return [...this.history];
  }

  public getLatestReport(): PerformanceReport | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  // ===================================
  // UTILIDADES
  // ===================================

  private generateBuildId(): string {
    return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public async saveReport(report: PerformanceReport, outputPath?: string): Promise<void> {
    const reportPath = outputPath || path.join(process.cwd(), 'performance-reports');
    
    try {
      await fs.mkdir(reportPath, { recursive: true });
      const filename = `performance-report-${report.buildId}.json`;
      const filepath = path.join(reportPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      console.log(`Performance report saved to: ${filepath}`);
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
  }

  public generateTextReport(report: PerformanceReport): string {
    const { violations, metrics, score, grade, trends } = report;

    let textReport = `
# Performance Budget Report
**Build ID**: ${report.buildId}
**Timestamp**: ${new Date(report.timestamp).toLocaleString()}
**Score**: ${score}/100 (Grade: ${grade})

## Metrics Summary
- **Bundle Size**: ${Math.round(metrics.bundleSize / 1024)}KB
- **First Load JS**: ${Math.round(metrics.firstLoadJS / 1024)}KB
- **Total JS**: ${Math.round(metrics.totalJS / 1024)}KB
- **CSS**: ${Math.round(metrics.css / 1024)}KB
- **Chunks**: ${metrics.chunkCount}
- **Duplicate Modules**: ${metrics.duplicateModules}

## Budget Violations (${violations.length})
`;

    if (violations.length === 0) {
      textReport += '✅ All performance budgets are within limits!\n';
    } else {
      violations.forEach((violation, i) => {
        const actualFormatted = violation.budget.unit === 'bytes' 
          ? `${Math.round(violation.actual / 1024)}KB`
          : `${violation.actual}${violation.budget.unit}`;
        
        const expectedFormatted = violation.budget.unit === 'bytes'
          ? `${Math.round(violation.expected / 1024)}KB`
          : `${violation.expected}${violation.budget.unit}`;

        textReport += `
${i + 1}. **${violation.budget.name}** (${violation.severity.toUpperCase()})
   - Actual: ${actualFormatted}
   - Expected: ≤ ${expectedFormatted}
   - Impact: ${violation.impact}
   - Recommendation: ${violation.recommendation}
`;
      });
    }

    if (trends.length > 0) {
      textReport += '\n## Trends\n';
      trends.forEach(trend => {
        const icon = trend.trend === 'improving' ? '📈' : trend.trend === 'degrading' ? '📉' : '➡️';
        const changeText = trend.changePercent > 0 ? `+${trend.changePercent.toFixed(1)}%` : `${trend.changePercent.toFixed(1)}%`;
        textReport += `- ${icon} **${trend.metric}**: ${changeText}\n`;
      });
    }

    return textReport;
  }
}









