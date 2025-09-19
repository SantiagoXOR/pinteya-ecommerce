import { promises as fs } from 'fs';
import path from 'path';
import { TestReport, TestStep } from './automated-test-framework';
import { ScreenshotMetadata } from './screenshot-manager';

export interface ReportOptions {
  outputDir?: string;
  includeScreenshots?: boolean;
  generateHtml?: boolean;
  generateJson?: boolean;
  theme?: 'light' | 'dark';
  includeTimeline?: boolean;
  includeSummaryCharts?: boolean;
}

export interface EnhancedTestReport extends TestReport {
  screenshots?: ScreenshotMetadata[];
  performance?: {
    avgStepDuration: number;
    slowestStep: TestStep;
    fastestStep: TestStep;
    totalScreenshotTime: number;
  };
  insights?: {
    recommendations: string[];
    patterns: string[];
    riskFactors: string[];
  } | undefined;
}

export class ReportGenerator {
  private options: Required<ReportOptions>;

  constructor(options?: ReportOptions) {
    this.options = {
      outputDir: options?.outputDir || path.join(process.cwd(), 'test-reports'),
      includeScreenshots: options?.includeScreenshots ?? true,
      generateHtml: options?.generateHtml ?? true,
      generateJson: options?.generateJson ?? true,
      theme: options?.theme || 'light',
      includeTimeline: options?.includeTimeline ?? true,
      includeSummaryCharts: options?.includeSummaryCharts ?? true
    };
  }

  /**
   * Genera un reporte completo con múltiples formatos
   */
  async generateReport(
    report: TestReport,
    screenshots?: ScreenshotMetadata[]
  ): Promise<{
    jsonPath?: string;
    htmlPath?: string;
    enhancedReport: EnhancedTestReport;
  }> {
    try {
      // Asegurar que el directorio existe
      await fs.mkdir(this.options.outputDir, { recursive: true });

      // Crear reporte mejorado
      const enhancedReport = await this.enhanceReport(report, screenshots);

      const results: {
        jsonPath?: string;
        htmlPath?: string;
        enhancedReport: EnhancedTestReport;
      } = { enhancedReport };

      // Generar reporte JSON
      if (this.options.generateJson) {
        results.jsonPath = await this.generateJsonReport(enhancedReport);
      }

      // Generar reporte HTML
      if (this.options.generateHtml) {
        results.htmlPath = await this.generateHtmlReport(enhancedReport);
      }

      console.log(`📊 Reporte generado exitosamente:`);
      if (results.jsonPath) {console.log(`   📄 JSON: ${results.jsonPath}`);}
      if (results.htmlPath) {console.log(`   🌐 HTML: ${results.htmlPath}`);}

      return results;

    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  }

  /**
   * Mejora el reporte con análisis adicionales
   */
  private async enhanceReport(
    report: TestReport,
    screenshots?: ScreenshotMetadata[]
  ): Promise<EnhancedTestReport> {
    const enhancedReport: EnhancedTestReport = {
      ...report,
      screenshots: screenshots || []
    };

    // Calcular métricas de rendimiento
    if (report.steps.length > 0) {
      const durations = report.steps.map(step => step.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const slowestStep = report.steps.reduce((prev, current) => 
        prev.duration > current.duration ? prev : current
      );
      const fastestStep = report.steps.reduce((prev, current) => 
        prev.duration < current.duration ? prev : current
      );
      const totalScreenshotTime = screenshots?.reduce((total, ss) => 
        total + (ss.duration || 0), 0
      ) || 0;

      enhancedReport.performance = {
        avgStepDuration: avgDuration,
        slowestStep,
        fastestStep,
        totalScreenshotTime
      };
    }

    // Generar insights
    enhancedReport.insights = this.generateInsights(report) || undefined;

    return enhancedReport;
  }

  /**
   * Genera insights y recomendaciones
   */
  private generateInsights(report: TestReport): EnhancedTestReport['insights'] {
    const recommendations: string[] = [];
    const patterns: string[] = [];
    const riskFactors: string[] = [];

    // Analizar patrones de fallas
    const failedSteps = report.steps.filter(step => !step.success);
    const criticalErrors = failedSteps.filter(step => step.severity === 'critical');

    if (criticalErrors.length > 0) {
      riskFactors.push(`${criticalErrors.length} errores críticos detectados`);
      recommendations.push('Revisar y corregir errores críticos antes de continuar');
    }

    // Analizar duración de pasos
    const longSteps = report.steps.filter(step => step.duration > 5000);
    if (longSteps.length > 0) {
      patterns.push(`${longSteps.length} pasos con duración superior a 5 segundos`);
      recommendations.push('Optimizar pasos lentos para mejorar el rendimiento');
    }

    // Analizar categorías de pasos
    const setupSteps = report.steps.filter(step => step.category === 'setup');
    const verificationSteps = report.steps.filter(step => step.category === 'verification');
    
    if (setupSteps.length > verificationSteps.length) {
      patterns.push('Más pasos de configuración que de verificación');
      recommendations.push('Considerar consolidar pasos de configuración');
    }

    // Analizar tasa de éxito
    const successRate = (report.summary.successfulSteps / report.summary.totalSteps) * 100;
    if (successRate < 80) {
      riskFactors.push(`Tasa de éxito baja: ${successRate.toFixed(1)}%`);
      recommendations.push('Investigar causas de fallas recurrentes');
    }

    return {
      recommendations,
      patterns,
      riskFactors
    };
  }

  /**
   * Genera reporte JSON mejorado
   */
  private async generateJsonReport(report: EnhancedTestReport): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${report.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.json`;
    const filePath = path.join(this.options.outputDir, filename);

    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }

  /**
   * Genera reporte HTML interactivo
   */
  private async generateHtmlReport(report: EnhancedTestReport): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${report.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.html`;
    const filePath = path.join(this.options.outputDir, filename);

    const htmlContent = this.generateHtmlContent(report);
    await fs.writeFile(filePath, htmlContent);
    return filePath;
  }

  /**
   * Genera el contenido HTML del reporte
   */
  private generateHtmlContent(report: EnhancedTestReport): string {
    const isDark = this.options.theme === 'dark';
    const successRate = (report.summary.successfulSteps / report.summary.totalSteps) * 100;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Test: ${report.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: ${isDark ? '#1a1a1a' : '#f5f5f5'};
            color: ${isDark ? '#e0e0e0' : '#333'};
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: ${isDark ? '#2d2d2d' : '#fff'};
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: ${isDark ? '#4CAF50' : '#2196F3'};
            margin-bottom: 10px;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
        }
        
        .status.completed { background: #4CAF50; color: white; }
        .status.failed { background: #f44336; color: white; }
        .status.running { background: #ff9800; color: white; }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .metric {
            background: ${isDark ? '#2d2d2d' : '#fff'};
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .metric-label {
            color: ${isDark ? '#aaa' : '#666'};
            font-size: 0.9em;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: ${isDark ? '#444' : '#eee'};
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.3s ease;
        }
        
        .steps-container {
            background: ${isDark ? '#2d2d2d' : '#fff'};
            border-radius: 10px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .step {
            border-left: 4px solid #ddd;
            padding: 15px 20px;
            margin: 10px 0;
            border-radius: 0 8px 8px 0;
            background: ${isDark ? '#333' : '#f9f9f9'};
        }
        
        .step.success { border-left-color: #4CAF50; }
        .step.failed { border-left-color: #f44336; }
        
        .step-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .step-title {
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .step-duration {
            color: ${isDark ? '#aaa' : '#666'};
            font-size: 0.9em;
        }
        
        .step-details {
            margin-top: 10px;
            padding: 10px;
            background: ${isDark ? '#444' : '#f0f0f0'};
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.9em;
        }
        
        .screenshot {
            margin: 10px 0;
        }
        
        .screenshot img {
            max-width: 100%;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .insights {
            background: ${isDark ? '#2d2d2d' : '#fff'};
            border-radius: 10px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .insight-section {
            margin: 20px 0;
        }
        
        .insight-section h3 {
            color: ${isDark ? '#4CAF50' : '#2196F3'};
            margin-bottom: 10px;
        }
        
        .insight-list {
            list-style: none;
        }
        
        .insight-list li {
            padding: 8px 0;
            border-bottom: 1px solid ${isDark ? '#444' : '#eee'};
        }
        
        .timestamp {
            color: ${isDark ? '#aaa' : '#666'};
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .summary {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${report.name}</h1>
            <p>${report.description}</p>
            <div style="margin-top: 15px;">
                <span class="status ${report.status}">${report.status}</span>
                <span class="timestamp">Ejecutado: ${new Date(report.startTime).toLocaleString()}</span>
            </div>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value" style="color: #4CAF50;">${report.summary.successfulSteps}</div>
                <div class="metric-label">Pasos Exitosos</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #f44336;">${report.summary.failedSteps}</div>
                <div class="metric-label">Pasos Fallidos</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #2196F3;">${successRate.toFixed(1)}%</div>
                <div class="metric-label">Tasa de Éxito</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #ff9800;">${report.duration ? Math.round(report.duration / 1000) : 0}s</div>
                <div class="metric-label">Duración Total</div>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${successRate}%;"></div>
        </div>
        
        ${this.options.includeTimeline ? this.generateTimelineHtml(report) : ''}
        
        <div class="steps-container">
            <h2>Pasos Ejecutados</h2>
            ${report.steps.map(step => `
                <div class="step ${step.success ? 'success' : 'failed'}">
                    <div class="step-header">
                        <div class="step-title">
                            ${step.success ? '✅' : '❌'} ${step.description}
                        </div>
                        <div class="step-duration">${step.duration}ms</div>
                    </div>
                    <div class="timestamp">⏰ ${new Date(step.timestamp).toLocaleString()}</div>
                    ${step.screenshot ? `
                        <div class="screenshot">
                            <p><strong>📸 Screenshot:</strong> ${path.basename(step.screenshot)}</p>
                        </div>
                    ` : ''}
                    ${step.details ? `
                        <div class="step-details">
                            <strong>Detalles:</strong><br>
                            <pre>${JSON.stringify(step.details, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        ${report.insights ? `
            <div class="insights">
                <h2>Análisis e Insights</h2>
                
                ${report.insights.recommendations.length > 0 ? `
                    <div class="insight-section">
                        <h3>💡 Recomendaciones</h3>
                        <ul class="insight-list">
                            ${report.insights.recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${report.insights.patterns.length > 0 ? `
                    <div class="insight-section">
                        <h3>📊 Patrones Identificados</h3>
                        <ul class="insight-list">
                            ${report.insights.patterns.map(pattern => `<li>• ${pattern}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${report.insights.riskFactors.length > 0 ? `
                    <div class="insight-section">
                        <h3>⚠️ Factores de Riesgo</h3>
                        <ul class="insight-list">
                            ${report.insights.riskFactors.map(risk => `<li>• ${risk}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="header" style="margin-top: 30px; text-align: center;">
            <p>Reporte generado automáticamente el ${new Date().toLocaleString()}</p>
            <p style="color: ${isDark ? '#aaa' : '#666'}; font-size: 0.9em; margin-top: 10px;">
                Framework: ${report.metadata.framework} v${report.metadata.testVersion}
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Genera HTML para la línea de tiempo
   */
  private generateTimelineHtml(report: EnhancedTestReport): string {
    if (!this.options.includeTimeline || report.steps.length === 0) {
      return '';
    }

    const startTime = new Date(report.startTime).getTime();
    const totalDuration = report.duration || 0;

    return `
        <div class="steps-container">
            <h2>📈 Línea de Tiempo</h2>
            <div style="position: relative; height: 60px; background: #f0f0f0; border-radius: 8px; margin: 20px 0;">
                ${report.steps.map((step, index) => {
                  const stepStart = new Date(step.timestamp).getTime();
                  const relativeStart = ((stepStart - startTime) / totalDuration) * 100;
                  const stepWidth = (step.duration / totalDuration) * 100;
                  
                  return `
                    <div style="
                        position: absolute;
                        left: ${relativeStart}%;
                        width: ${stepWidth}%;
                        height: 100%;
                        background: ${step.success ? '#4CAF50' : '#f44336'};
                        border-radius: 4px;
                        opacity: 0.8;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 10px;
                        font-weight: bold;
                    " title="${step.description} (${step.duration}ms)">
                        ${index + 1}
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
    `;
  }
}









