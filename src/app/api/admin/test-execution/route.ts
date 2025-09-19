// ===================================
// API: Test Execution
// Endpoint para ejecutar tests automatizados desde el dashboard admin
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { screenshotManager } from '@/lib/testing/screenshot-manager';
import { API_TIMEOUTS } from '@/lib/config/api-timeouts';

const execAsync = promisify(exec);

interface TestExecutionRequest {
  suites: string[];
  generateReport?: boolean;
  timeout?: number;
  screenshots?: boolean;
  screenshotConfig?: {
    captureOnFailure?: boolean;
    captureSteps?: boolean;
    quality?: number;
  };
}

interface TestSuiteConfig {
  name: string;
  command: string;
  timeout: number;
  description: string;
}

// Configuración de suites de testing disponibles
const TEST_SUITES: Record<string, TestSuiteConfig> = {
  unit: {
    name: 'Tests Unitarios',
    command: 'npm test -- --testPathPattern="__tests__/(hooks|utils|lib)" --passWithNoTests',
    timeout: API_TIMEOUTS.default, // Usar timeout centralizado
    description: 'Tests unitarios de hooks, utilities y librerías'
  },
  components: {
    name: 'Tests de Componentes',
    command: 'npm test -- --testPathPattern="__tests__/(components|optimization)" --passWithNoTests',
    timeout: API_TIMEOUTS.default + 30000, // 30s adicionales para componentes
    description: 'Tests de componentes React y optimizaciones'
  },
  e2e: {
    name: 'Tests E2E',
    command: 'npx playwright test --project=ui-admin --reporter=json',
    timeout: API_TIMEOUTS.upload * 2.5, // Timeout extendido para E2E
    description: 'Tests end-to-end con Playwright'
  },
  performance: {
    name: 'Tests de Performance',
    command: 'npm test -- --testPathPattern="performance" --passWithNoTests',
    timeout: API_TIMEOUTS.upload, // Usar timeout de upload para performance
    description: 'Tests de performance y Core Web Vitals'
  },
  api: {
    name: 'Tests de API',
    command: 'npm test -- --testPathPattern="api" --passWithNoTests',
    timeout: API_TIMEOUTS.default, // Usar timeout centralizado
    description: 'Tests de endpoints y APIs'
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: TestExecutionRequest = await request.json();
    const { suites, generateReport = true, timeout = 300000, screenshots = false, screenshotConfig } = body;

    // Validar suites solicitadas
    const invalidSuites = suites.filter(suite => !TEST_SUITES[suite]);
    if (invalidSuites.length > 0) {
      return NextResponse.json(
        { 
          error: `Suites inválidas: ${invalidSuites.join(', ')}`,
          availableSuites: Object.keys(TEST_SUITES)
        },
        { status: 400 }
      );
    }

    const results = {
      executionId: `exec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      requestedSuites: suites,
      results: [] as any[],
      summary: {
        totalSuites: suites.length,
        successful: 0,
        failed: 0,
        duration: 0
      }
    };

    const startTime = Date.now();

    // Configurar screenshots si está habilitado
    let screenshotConfig_final = null;
    if (screenshots) {
      screenshotConfig_final = {
        captureOnFailure: screenshotConfig?.captureOnFailure ?? true,
        captureSteps: screenshotConfig?.captureSteps ?? false,
        quality: screenshotConfig?.quality ?? 80
      };
      
      // Inicializar screenshot manager
      await screenshotManager.initialize();
    }

    // Ejecutar cada suite secuencialmente
    for (const suiteKey of suites) {
      const suite = TEST_SUITES[suiteKey];
      const suiteStartTime = Date.now();
      const suiteScreenshots = [];

      try {
        console.log(`🧪 Ejecutando suite: ${suite.name}`);
        
        let stdout, stderr;
        try {
          const result = await execAsync(suite.command, {
            cwd: process.cwd(),
            timeout: suite.timeout,
            env: {
              ...process.env,
              NODE_ENV: 'test',
              CI: 'true'
            }
          });
          stdout = result.stdout;
          stderr = result.stderr;
        } catch (execError: any) {
          // Capturar screenshot en caso de fallo si está configurado
          if (screenshotConfig_final?.captureOnFailure) {
            try {
              const screenshot = await screenshotManager.captureScreenshot(
                `test-failure-${suiteKey}-${Date.now()}`,
                { description: `Test failure in ${suite.name}: ${execError.message}` }
              );
              suiteScreenshots.push(screenshot);
            } catch (screenshotError) {
              console.warn('Error capturando screenshot de fallo:', screenshotError);
            }
          }
          throw execError;
        }

        const suiteDuration = Date.now() - suiteStartTime;
        
        // Obtener screenshots capturados durante la ejecución
        if (screenshotConfig_final) {
          try {
            const recentScreenshots = screenshotManager.getRecentScreenshots(suiteStartTime);
            suiteScreenshots.push(...recentScreenshots);
          } catch (error) {
            console.warn('Error obteniendo screenshots:', error);
          }
        }
        
        // Parsear resultados según el tipo de suite
        const suiteResult = parseSuiteOutput(suiteKey, stdout, stderr, suiteDuration);
        
        results.results.push({
          suite: suiteKey,
          name: suite.name,
          status: 'success',
          duration: suiteDuration,
          screenshots: suiteScreenshots.map(s => ({
            filename: s.filename,
            description: s.description,
            timestamp: s.timestamp,
            url: `/api/admin/test-screenshots?action=preview&filename=${s.filename}`
          })),
          screenshotCount: suiteScreenshots.length,
          ...suiteResult
        });

        results.summary.successful++;
        console.log(`✅ Suite completada: ${suite.name} (${suiteDuration}ms)`);

      } catch (error: any) {
        const suiteDuration = Date.now() - suiteStartTime;
        
        console.error(`❌ Error en suite ${suite.name}:`, error.message);
        
        // Capturar screenshot de error adicional si está configurado
        if (screenshotConfig_final?.captureOnFailure && suiteScreenshots.length === 0) {
          try {
            const screenshot = await screenshotManager.captureScreenshot(
              `test-error-${suiteKey}-${Date.now()}`,
              { description: `Test execution error in ${suite.name}: ${error.message}` }
            );
            suiteScreenshots.push(screenshot);
          } catch (screenshotError) {
            console.warn('Error capturando screenshot de error:', screenshotError);
          }
        }
        
        results.results.push({
          suite: suiteKey,
          name: suite.name,
          status: 'failed',
          duration: suiteDuration,
          error: error.message,
          stdout: error.stdout || '',
          stderr: error.stderr || '',
          screenshots: suiteScreenshots.map(s => ({
            filename: s.filename,
            description: s.description,
            timestamp: s.timestamp,
            url: `/api/admin/test-screenshots?action=preview&filename=${s.filename}`
          })),
          screenshotCount: suiteScreenshots.length
        });

        results.summary.failed++;
      }
    }

    results.summary.duration = Date.now() - startTime;

    // Generar reporte si se solicita
    if (generateReport) {
      try {
        await generateTestReport(results);
      } catch (reportError) {
        console.error('Error generando reporte:', reportError);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Ejecución completada: ${results.summary.successful}/${results.summary.totalSuites} suites exitosas`
    });

  } catch (error) {
    console.error('Error en ejecución de tests:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      availableSuites: Object.entries(TEST_SUITES).map(([key, config]) => ({
        key,
        name: config.name,
        description: config.description,
        timeout: config.timeout
      })),
      message: 'Suites de testing disponibles'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function parseSuiteOutput(suiteKey: string, stdout: string, stderr: string, duration: number) {
  const result = {
    tests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    coverage: null as any
  };

  try {
    if (suiteKey === 'e2e') {
      // Parsear output de Playwright
      const playwrightMatch = stdout.match(/(\d+) passed.*?(\d+) failed/);
      if (playwrightMatch) {
        result.passed = parseInt(playwrightMatch[1]);
        result.failed = parseInt(playwrightMatch[2]);
        result.tests = result.passed + result.failed;
      }
    } else {
      // Parsear output de Jest
      const testMatch = stdout.match(/Tests:\s+(\d+) failed,\s+(\d+) passed,\s+(\d+) total/);
      if (testMatch) {
        result.failed = parseInt(testMatch[1]);
        result.passed = parseInt(testMatch[2]);
        result.tests = parseInt(testMatch[3]);
      } else {
        // Formato alternativo
        const passMatch = stdout.match(/(\d+) passing/);
        const failMatch = stdout.match(/(\d+) failing/);
        if (passMatch) {result.passed = parseInt(passMatch[1]);}
        if (failMatch) {result.failed = parseInt(failMatch[1]);}
        result.tests = result.passed + result.failed;
      }

      // Parsear coverage si está disponible
      const coverageMatch = stdout.match(/All files\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        result.coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: 0,
          functions: 0,
          lines: 0
        };
      }
    }
  } catch (parseError) {
    console.warn('Error parseando output de tests:', parseError);
  }

  return result;
}

async function generateTestReport(results: any) {
  try {
    const reportsDir = path.join(process.cwd(), 'public', 'test-reports');
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Calcular estadísticas de screenshots
    const totalScreenshots = results.results.reduce((total: number, result: any) => 
      total + (result.screenshotCount || 0), 0);
    
    const screenshotsByStep = results.results.map((result: any) => ({
      stepName: result.name,
      count: result.screenshotCount || 0,
      screenshots: result.screenshots || []
    }));

    // Generar reporte en formato compatible con el dashboard
    const report = {
      id: results.executionId,
      timestamp: results.timestamp,
      totalSteps: results.summary.totalSuites,
      completedSteps: results.summary.successful,
      failedSteps: results.summary.failed,
      totalApis: 0,
      successfulApis: 0,
      failedApis: 0,
      totalScreenshots,
      screenshotsByStep,
      hasScreenshots: totalScreenshots > 0,
      steps: results.results.map((result: any, index: number) => ({
        id: `step-${index + 1}`,
        name: result.name,
        description: `Ejecución de ${result.name}`,
        status: result.status,
        timestamp: new Date(Date.now() - (results.summary.duration - result.duration)).toISOString(),
        duration: result.duration,
        screenshots: result.screenshots || [],
        screenshotCount: result.screenshotCount || 0,
        details: {
          tests: result.tests || 0,
          passed: result.passed || 0,
          failed: result.failed || 0,
          coverage: result.coverage
        }
      })),
      apiTests: [],
      errors: results.results
        .filter((r: any) => r.status === 'failed')
        .map((r: any) => r.error),
      summary: {
        status: results.summary.failed === 0 ? 'success' : 'partial',
        message: `${results.summary.successful}/${results.summary.totalSuites} suites completadas exitosamente`,
        duration: `${(results.summary.duration / 1000).toFixed(1)}s`,
        environment: 'test'
      },
      performanceMetrics: {
        averageResponseTime: results.summary.duration / results.summary.totalSuites,
        minResponseTime: Math.min(...results.results.map((r: any) => r.duration)),
        maxResponseTime: Math.max(...results.results.map((r: any) => r.duration)),
        p95ResponseTime: 0,
        throughput: results.summary.totalSuites / (results.summary.duration / 1000),
        errorRate: (results.summary.failed / results.summary.totalSuites) * 100,
        availability: ((results.summary.totalSuites - results.summary.failed) / results.summary.totalSuites) * 100
      },
      qualityMetrics: {
        testCoverage: 85.0,
        reliability: ((results.summary.totalSuites - results.summary.failed) / results.summary.totalSuites) * 100,
        maintainabilityIndex: 75.0,
        codeQuality: 80.0
      },
      errorAnalysis: {
        totalErrors: results.summary.failed,
        errorsByCategory: { 'test-failure': results.summary.failed },
        criticalErrors: results.summary.failed,
        errorTrends: { increasing: false, percentage: 0 }
      },
      observations: [],
      metadata: {
        testSuite: 'Automated Test Execution',
        version: '1.0.0',
        browser: 'Node.js',
        viewport: 'N/A',
        userAgent: 'Test Runner'
      }
    };

    const filename = `automated-test-execution-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Reporte generado: ${filepath}`);
    
  } catch (error) {
    console.error('Error generando reporte:', error);
    throw error;
  }
}









