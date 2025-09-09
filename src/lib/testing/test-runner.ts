#!/usr/bin/env node

import { SampleE2ETest } from './sample-e2e-test';
import { AutomatedTestFramework } from './automated-test-framework';
import { ScreenshotManager } from './screenshot-manager';
import { ReportGenerator } from './report-generator';
import fs from 'fs/promises';
import path from 'path';

/**
 * Runner principal para ejecutar tests automatizados
 */
export class TestRunner {
  private config: TestRunnerConfig;

  constructor(config: Partial<TestRunnerConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:3000',
      outputDir: path.join(process.cwd(), 'test-reports'),
      screenshotsDir: path.join(process.cwd(), 'test-screenshots'),
      browserType: 'chromium',
      headless: false,
      timeout: 30000,
      retries: 1,
      parallel: false,
      ...config
    };
  }

  /**
   * Ejecuta todos los tests disponibles
   */
  async runAllTests(): Promise<TestRunResults> {
    console.log('🚀 Iniciando ejecución de tests automatizados');
    console.log(`📍 URL Base: ${this.config.baseUrl}`);
    console.log(`📁 Directorio de reportes: ${this.config.outputDir}`);
    console.log(`📸 Directorio de screenshots: ${this.config.screenshotsDir}`);
    console.log('\n' + '='.repeat(60));

    const results: TestRunResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      testResults: [],
      reportPaths: []
    };

    try {
      // Crear directorios necesarios
      await this.ensureDirectories();

      // Lista de tests a ejecutar
      const tests = [
        {
          name: 'E2E Purchase Flow Test',
          description: 'Test completo del flujo de compra',
          testClass: SampleE2ETest,
          priority: 'high'
        }
        // Aquí se pueden agregar más tests en el futuro
      ];

      results.totalTests = tests.length;

      // Ejecutar cada test
      for (const testConfig of tests) {
        console.log(`\n🧪 Ejecutando: ${testConfig.name}`);
        console.log(`📝 Descripción: ${testConfig.description}`);
        console.log(`⚡ Prioridad: ${testConfig.priority}`);
        console.log('-'.repeat(40));

        const testResult = await this.runSingleTest(testConfig);
        results.testResults.push(testResult);

        if (testResult.success) {
          results.passedTests++;
          console.log(`✅ ${testConfig.name} - EXITOSO`);
        } else {
          results.failedTests++;
          console.log(`❌ ${testConfig.name} - FALLIDO`);
        }

        if (testResult.reportPath) {
          results.reportPaths.push(testResult.reportPath);
        }
      }

      results.endTime = new Date();
      results.duration = results.endTime.getTime() - results.startTime.getTime();

      // Generar reporte consolidado
      await this.generateConsolidatedReport(results);

      // Mostrar resumen final
      this.displayFinalSummary(results);

      return results;

    } catch (error) {
      console.error('💥 Error crítico durante la ejecución de tests:', error);
      results.endTime = new Date();
      results.duration = results.endTime.getTime() - results.startTime.getTime();
      throw error;
    }
  }

  /**
   * Ejecuta un test individual
   */
  private async runSingleTest(testConfig: any): Promise<TestResult> {
    const startTime = new Date();
    let success = false;
    let error: string | null = null;
    let reportPath: string | null = null;
    let htmlReportPath: string | null = null;

    try {
      // Crear instancia del test
      const testInstance = new testConfig.testClass(this.config.baseUrl);
      
      // Ejecutar el test
      const result = await testInstance.runTest();
      
      success = result.success;
      reportPath = result.reportPath;
      htmlReportPath = result.htmlReportPath;

    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error en ${testConfig.name}:`, error);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return {
      name: testConfig.name,
      description: testConfig.description,
      success,
      error,
      startTime,
      endTime,
      duration,
      reportPath,
      htmlReportPath
    };
  }

  /**
   * Asegura que los directorios necesarios existan
   */
  private async ensureDirectories(): Promise<void> {
    const directories = [
      this.config.outputDir,
      this.config.screenshotsDir
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
      }
    }
  }

  /**
   * Genera un reporte consolidado de todos los tests
   */
  private async generateConsolidatedReport(results: TestRunResults): Promise<void> {
    const reportData = {
      summary: {
        totalTests: results.totalTests,
        passedTests: results.passedTests,
        failedTests: results.failedTests,
        skippedTests: results.skippedTests,
        successRate: results.totalTests > 0 ? (results.passedTests / results.totalTests) * 100 : 0,
        startTime: results.startTime.toISOString(),
        endTime: results.endTime.toISOString(),
        duration: results.duration
      },
      configuration: {
        baseUrl: this.config.baseUrl,
        browserType: this.config.browserType,
        headless: this.config.headless,
        timeout: this.config.timeout
      },
      testResults: results.testResults.map(test => ({
        name: test.name,
        description: test.description,
        success: test.success,
        error: test.error,
        duration: test.duration,
        startTime: test.startTime.toISOString(),
        endTime: test.endTime.toISOString(),
        reportPath: test.reportPath,
        htmlReportPath: test.htmlReportPath
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        framework: 'AutomatedTestFramework',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Guardar reporte JSON consolidado
    const consolidatedReportPath = path.join(
      this.config.outputDir,
      `consolidated-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    await fs.writeFile(
      consolidatedReportPath,
      JSON.stringify(reportData, null, 2),
      'utf-8'
    );

    console.log(`\n📊 Reporte consolidado generado: ${consolidatedReportPath}`);
    results.reportPaths.push(consolidatedReportPath);
  }

  /**
   * Muestra el resumen final de la ejecución
   */
  private displayFinalSummary(results: TestRunResults): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL DE TESTS');
    console.log('='.repeat(60));
    console.log(`📈 Total de tests: ${results.totalTests}`);
    console.log(`✅ Tests exitosos: ${results.passedTests}`);
    console.log(`❌ Tests fallidos: ${results.failedTests}`);
    console.log(`⏭️  Tests omitidos: ${results.skippedTests}`);
    
    const successRate = results.totalTests > 0 ? (results.passedTests / results.totalTests) * 100 : 0;
    console.log(`📊 Tasa de éxito: ${successRate.toFixed(1)}%`);
    
    const durationMinutes = Math.floor(results.duration / 60000);
    const durationSeconds = Math.floor((results.duration % 60000) / 1000);
    console.log(`⏱️  Duración total: ${durationMinutes}m ${durationSeconds}s`);
    
    console.log('\n📁 Reportes generados:');
    results.reportPaths.forEach((reportPath, index) => {
      console.log(`   ${index + 1}. ${reportPath}`);
    });
    
    console.log('='.repeat(60));
    
    if (results.failedTests === 0) {
      console.log('🎉 ¡Todos los tests se ejecutaron exitosamente!');
    } else {
      console.log(`⚠️  ${results.failedTests} test(s) fallaron. Revisa los reportes para más detalles.`);
    }
  }

  /**
   * Ejecuta tests con configuración personalizada
   */
  static async runWithConfig(config: Partial<TestRunnerConfig>): Promise<TestRunResults> {
    const runner = new TestRunner(config);
    return await runner.runAllTests();
  }

  /**
   * Ejecuta un test específico por nombre
   */
  static async runSpecificTest(testName: string, config: Partial<TestRunnerConfig> = {}): Promise<void> {
    console.log(`🎯 Ejecutando test específico: ${testName}`);
    
    switch (testName.toLowerCase()) {
      case 'e2e':
      case 'purchase':
      case 'sample':
        await SampleE2ETest.run(config.baseUrl);
        break;
      default:
        console.error(`❌ Test no encontrado: ${testName}`);
        console.log('Tests disponibles: e2e, purchase, sample');
        process.exit(1);
    }
  }
}

// Interfaces
interface TestRunnerConfig {
  baseUrl: string;
  outputDir: string;
  screenshotsDir: string;
  browserType: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  timeout: number;
  retries: number;
  parallel: boolean;
}

interface TestResult {
  name: string;
  description: string;
  success: boolean;
  error: string | null;
  startTime: Date;
  endTime: Date;
  duration: number;
  reportPath: string | null;
  htmlReportPath?: string | null;
}

interface TestRunResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  testResults: TestResult[];
  reportPaths: string[];
}

// CLI Support
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const config: Partial<TestRunnerConfig> = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    headless: process.env.TEST_HEADLESS === 'true',
    browserType: (process.env.TEST_BROWSER as any) || 'chromium'
  };

  switch (command) {
    case 'all':
    case undefined:
      console.log('🚀 Ejecutando todos los tests...');
      TestRunner.runWithConfig(config)
        .then(results => {
          process.exit(results.failedTests > 0 ? 1 : 0);
        })
        .catch(error => {
          console.error('💥 Error ejecutando tests:', error);
          process.exit(1);
        });
      break;
      
    case 'e2e':
    case 'sample':
    case 'purchase':
      TestRunner.runSpecificTest(command, config)
        .then(() => {
          console.log('✅ Test específico completado');
          process.exit(0);
        })
        .catch(error => {
          console.error('💥 Error ejecutando test específico:', error);
          process.exit(1);
        });
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log(`
🧪 Test Runner - Automated Testing Framework

Uso:
  npm run test:e2e [comando] [opciones]

Comandos:
  all, (vacío)    Ejecutar todos los tests
  e2e             Ejecutar test E2E específico
  sample          Ejecutar test de ejemplo
  purchase        Ejecutar test de flujo de compra
  help            Mostrar esta ayuda

Variables de entorno:
  TEST_BASE_URL   URL base para los tests (default: http://localhost:3000)
  TEST_HEADLESS   Ejecutar en modo headless (default: false)
  TEST_BROWSER    Navegador a usar: chromium, firefox, webkit (default: chromium)

Ejemplos:
  npm run test:e2e
  npm run test:e2e e2e
  TEST_HEADLESS=true npm run test:e2e all
  TEST_BASE_URL=http://localhost:4000 npm run test:e2e sample
`);
      break;
      
    default:
      console.error(`❌ Comando desconocido: ${command}`);
      console.log('Usa "npm run test:e2e help" para ver los comandos disponibles.');
      process.exit(1);
  }
}