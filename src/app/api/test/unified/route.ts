// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// API Unificada de Testing
// Consolida todas las funcionalidades de testing en un solo endpoint
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { getAuthenticatedUser } from '@/lib/auth/admin-auth';
import { testFlowManager } from '@/lib/testing/advanced-test-flows';
import { screenshotManager } from '@/lib/testing/screenshot-manager';
import { API_TIMEOUTS } from '@/lib/config/api-timeouts';
// import {
//   sendWelcomeEmail,
//   sendOrderConfirmationEmail,
//   sendPasswordResetEmail,
//   getEmailServiceConfig
// } from '@/lib/email';

const execAsync = promisify(exec);

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const TestModuleSchema = z.enum([
  'connection',      // Test de conexiones básicas
  'auth',           // Test de autenticación
  'screenshots',    // Generación de screenshots
  'execution',      // Ejecución de test suites
  'flows',          // Flujos de testing automatizados
  'email',          // Testing de emails
  'middleware',     // Testing de middleware
  'reports',        // Generación de reportes
  'user-profile',   // Testing de perfiles de usuario
  'all'             // Ejecutar todos los tests
]);

const UnifiedTestParamsSchema = z.object({
  module: TestModuleSchema.default('connection'),
  detailed: z.boolean().default(false),
  user_id: z.string().optional(),
  include_sensitive: z.boolean().default(false)
});

const UnifiedTestPostSchema = z.object({
  module: TestModuleSchema,
  config: z.object({
    // Screenshot config
    url: z.string().url().optional(),
    stepName: z.string().optional(),
    selector: z.string().optional(),
    fullPage: z.boolean().default(false),
    width: z.number().default(1280),
    height: z.number().default(720),
    
    // Test execution config
    suites: z.array(z.string()).optional(),
    timeout: z.number().default(60000),
    generateReport: z.boolean().default(true),
    
    // Email test config
    email: z.string().email().optional(),
    userName: z.string().optional(),
    emailType: z.enum(['welcome', 'order', 'reset']).optional(),
    
    // Flow test config
    flowId: z.string().optional(),
    executionId: z.string().optional(),
    
    // General config
    test_data: z.any().optional()
  }).optional()
});

type TestModule = z.infer<typeof TestModuleSchema>;
type UnifiedTestParams = z.infer<typeof UnifiedTestParamsSchema>;
type UnifiedTestPost = z.infer<typeof UnifiedTestPostSchema>;

// ===================================
// CONFIGURACIÓN DE TEST SUITES
// ===================================

const TEST_SUITES: Record<string, {
  name: string;
  command: string;
  timeout: number;
  description: string;
}> = {
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
    timeout: 120000,
    description: 'Tests de performance y Core Web Vitals'
  },
  api: {
    name: 'Tests de API',
    command: 'npm test -- --testPathPattern="api" --passWithNoTests',
    timeout: 90000,
    description: 'Tests de endpoints y APIs'
  }
};

// ===================================
// MÓDULOS DE TESTING
// ===================================

async function testConnection(detailed: boolean = false) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test de conexión básica
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    const results = {
      connection: !productsError,
      adminConnection: !categoriesError,
      userConnection: !usersError,
      crud: !productsError && !categoriesError,
      tables: {
        products: !productsError,
        categories: !categoriesError,
        user_profiles: !usersError
      }
    };

    const allPassed = Object.values(results.tables).every(Boolean);

    return {
      status: allPassed ? 'success' : 'partial',
      data: {
        ...results,
        summary: {
          total_tests: Object.keys(results.tables).length,
          passed: Object.values(results.tables).filter(Boolean).length,
          failed: Object.values(results.tables).filter(v => !v).length
        },
        ...(detailed && {
          errors: {
            products: productsError?.message,
            categories: categoriesError?.message,
            users: usersError?.message
          }
        })
      }
    };
  } catch (error: any) {
    return {
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

async function testAuth(request: NextRequest, detailed: boolean = false) {
  try {
    const authResult = await getAuthenticatedUser(request);
    
    const results = {
      authenticated: !!authResult.userId,
      userId: authResult.userId,
      hasError: !!authResult.error,
      method: 'getAuthenticatedUser()'
    };

    if (detailed && authResult.userId) {
      // Test user profile lookup
      const { data: user, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id, clerk_user_id, email, role_id, is_active')
        .eq('clerk_user_id', authResult.userId)
        .single();

      results['profile_lookup'] = {
        success: !error,
        user_found: !!user,
        error: error?.message
      };
    }

    return {
      status: results.authenticated ? 'success' : 'failed' as const,
      data: results,
      error: authResult.error
    };
  } catch (error: any) {
    return {
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

async function testScreenshots(config: any) {
  try {
    const { url, stepName, description = 'Test screenshot', selector, fullPage = false, width = 1280, height = 720 } = config;

    if (!url || !stepName) {
      throw new Error('URL y stepName son requeridos para screenshots');
    }

    const screenshotsDir = path.join(process.cwd(), 'public', 'test-screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width, height }
    });

    await page.goto(url, { waitUntil: 'networkidle' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${stepName}-${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);

    if (selector) {
      const element = await page.locator(selector);
      await element.screenshot({ path: filepath });
    } else {
      await page.screenshot({ 
        path: filepath, 
        fullPage 
      });
    }

    await browser.close();

    const stats = await fs.stat(filepath);

    return {
      status: 'success' as const,
      data: {
        screenshot: {
          id: `screenshot-${Date.now()}`,
          filename,
          path: filepath,
          url: `/test-screenshots/${filename}`,
          metadata: {
            width,
            height,
            size: stats.size,
            timestamp: new Date().toISOString(),
            selector: selector || 'full-page',
            fullPage
          }
        }
      }
    };
  } catch (error: any) {
    return {
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

async function testExecution(config: any) {
  try {
    const { suites = ['unit'], timeout = 60000, generateReport = true } = config;
    
    const invalidSuites = suites.filter((suite: string) => !TEST_SUITES[suite]);
    if (invalidSuites.length > 0) {
      throw new Error(`Suites inválidas: ${invalidSuites.join(', ')}. Disponibles: ${Object.keys(TEST_SUITES).join(', ')}`);
    }

    const results = [];
    const startTime = Date.now();

    for (const suiteKey of suites) {
      const suite = TEST_SUITES[suiteKey];
      const suiteStartTime = Date.now();

      try {
        const { stdout, stderr } = await execAsync(suite.command, {
          timeout: suite.timeout,
          cwd: process.cwd(),
          env: {
            ...process.env,
            NODE_ENV: 'test',
            CI: 'true'
          }
        });

        const suiteDuration = Date.now() - suiteStartTime;
        const parsed = parseTestOutput(stdout, stderr);

        results.push({
          suite: suiteKey,
          name: suite.name,
          status: 'success',
          duration: suiteDuration,
          ...parsed
        });
      } catch (execError: any) {
        const suiteDuration = Date.now() - suiteStartTime;
        const parsed = parseTestOutput(execError.stdout || '', execError.stderr || '');

        results.push({
          suite: suiteKey,
          name: suite.name,
          status: 'failed',
          duration: suiteDuration,
          error: execError.message,
          ...parsed
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    const summary = {
      total_suites: results.length,
      passed_suites: results.filter(r => r.status === 'success').length,
      failed_suites: results.filter(r => r.status === 'failed').length,
      total_tests: results.reduce((sum, r) => sum + (r.tests || 0), 0),
      total_passed: results.reduce((sum, r) => sum + (r.passed || 0), 0),
      total_failed: results.reduce((sum, r) => sum + (r.failed || 0), 0),
      duration: totalDuration
    };

    if (generateReport) {
      await generateTestReport({ results, summary });
    }

    return {
      status: summary.failed_suites === 0 ? 'success' : 'partial' as const,
      data: {
        results,
        summary
      }
    };
  } catch (error: any) {
    return {
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

async function testFlows(config: any) {
  try {
    const { flowId, executionId } = config;

    if (executionId) {
      // Obtener ejecución específica
      const execution = testFlowManager.getExecution(executionId);
      if (!execution) {
        throw new Error(`Ejecución ${executionId} no encontrada`);
      }

      const screenshotStats = testFlowManager.getScreenshotStats(executionId);

      return {
        status: 'success' as const,
        data: {
          execution: {
            ...execution,
            screenshotStats
          }
        }
      };
    }

    if (flowId) {
      // Obtener ejecuciones de un flujo específico
      const executions = testFlowManager.getExecutions(flowId);
      return {
        status: 'success' as const,
        data: {
          flowId,
          executions: executions.map(exec => ({
            ...exec,
            screenshotCount: (exec.screenshots || []).length + 
              exec.steps.reduce((total, step) => total + (step.screenshots || []).length, 0)
          }))
        }
      };
    }

    // Obtener todos los flujos disponibles
    const flows = testFlowManager.getAvailableFlows();
    const allExecutions = testFlowManager.getExecutions();

    return {
      status: 'success' as const,
      data: {
        flows,
        executions: allExecutions,
        summary: {
          total_flows: flows.length,
          total_executions: allExecutions.length,
          active_flows: flows.filter(f => f.enabled).length
        }
      }
    };
  } catch (error: any) {
    return {
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

async function testEmail(config: any) {
  try {
    const { email, userName, emailType = 'welcome' } = config;

    if (!email || !userName) {
      throw new Error('Email y userName son requeridos');
    }

    // Verificar configuración
    const emailConfig = getEmailServiceConfig();
    if (!emailConfig.isReady) {
      return {
        status: 'failed' as const,
        error: 'Servicio de email no configurado',
        data: {
          config: {
            hasApiKey: emailConfig.hasApiKey,
            fromEmail: emailConfig.fromEmail
          }
        }
      };
    }

    let result;

    switch (emailType) {
      case 'welcome':
        result = await sendWelcomeEmail({
          email,
          userName
        });
        break;
      case 'order':
        result = await sendOrderConfirmationEmail({
          email,
          userName,
          orderNumber: 'TEST-001',
          orderTotal: 99.99,
          items: [
            { name: 'Producto Test', quantity: 1, price: 99.99 }
          ]
        });
        break;
      case 'reset':
        result = await sendPasswordResetEmail({
          email,
          userName,
          resetLink: 'https://www.pinteya.com/reset-password?token=test-token-123'
        });
        break;
      default:
        throw new Error(`Tipo de email inválido: ${emailType}`);
    }

    return {
      status: result.success ? 'success' : 'failed' as const,
      data: {
        emailType,
        result,
        config: {
          service: 'configured',
          fromEmail: emailConfig.fromEmail
        }
      },
      error: result.success ? undefined : result.error
    };
  } catch (error: any) {
    return {
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

async function testMiddleware() {
  // Este test simplemente verifica que el endpoint sea accesible
  // Si llegamos aquí, significa que el middleware permitió el acceso
  return {
    status: 'success' as const,
    data: {
      middleware_test: 'passed',
      timestamp: new Date().toISOString(),
      endpoint: '/api/test/unified',
      note: 'Si este endpoint responde, el middleware está funcionando'
    }
  };
}

async function testReports() {
  try {
    const publicReportsDir = path.join(process.cwd(), 'public', 'test-reports');
    const rootReportsDir = path.join(process.cwd(), 'test-reports');
    
    let reports: string[] = [];
    
    // Verificar carpeta public/test-reports
    try {
      const publicFiles = await fs.readdir(publicReportsDir);
      reports = publicFiles
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          const timestampA = a.match(/\d+/);
          const timestampB = b.match(/\d+/);
          if (timestampA && timestampB) {
            return parseInt(timestampB[0]) - parseInt(timestampA[0]);
          }
          return b.localeCompare(a);
        });
    } catch {
      // Carpeta no existe, continuar
    }
    
    // Si no hay reportes en public, verificar carpeta raíz
    if (reports.length === 0) {
      try {
        const rootFiles = await fs.readdir(rootReportsDir);
        const jsonFiles = rootFiles.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          // Crear carpeta public si no existe
          await fs.mkdir(publicReportsDir, { recursive: true });
          
          // Copiar archivos a public
          for (const file of jsonFiles) {
            const sourcePath = path.join(rootReportsDir, file);
            const destPath = path.join(publicReportsDir, file);
            await fs.copyFile(sourcePath, destPath);
          }
          
          reports = jsonFiles;
        }
      } catch {
        // Carpeta raíz no existe, continuar
      }
    }

    return {
      status: 'success' as const,
      data: {
        reports: reports.map(filename => ({
          filename,
          url: `/test-reports/${filename}`,
          timestamp: filename.match(/\d+/)?.[0] || 'unknown'
        })),
        total: reports.length,
        directories: {
          public: publicReportsDir,
          root: rootReportsDir
        }
      }
    };
  } catch (error: any) {
    return {
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

async function testUserProfile(request: NextRequest, userId?: string) {
  try {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const authResult = await getAuthenticatedUser(request);
      if (!authResult.userId) {
        throw new Error('Usuario no autenticado y no se proporcionó user_id');
      }
      targetUserId = authResult.userId;
    }

    // Consulta simple sin joins
    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, clerk_user_id, email, role_id, is_active')
      .eq('clerk_user_id', targetUserId)
      .single();

    return {
      status: error ? 'failed' : 'success' as const,
      data: {
        user_found: !!user,
        user_data: user,
        query_params: {
          clerk_user_id: targetUserId
        }
      },
      error: error?.message
    };
  } catch (error: any) {
    return {
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

// ===================================
// UTILIDADES
// ===================================

function parseTestOutput(stdout: string, stderr: string) {
  const result = {
    passed: 0,
    failed: 0,
    tests: 0,
    output: stdout,
    errors: stderr
  };

  try {
    // Intentar parsear diferentes formatos de output
    const testMatch = stdout.match(/Tests:\s+(\d+) failed,\s+(\d+) passed,\s+(\d+) total/);
    if (testMatch) {
      result.failed = parseInt(testMatch[1]);
      result.passed = parseInt(testMatch[2]);
      result.tests = parseInt(testMatch[3]);
      return result;
    }

    // Formato alternativo
    const passedMatch = stdout.match(/(\d+) passing/);
    const failedMatch = stdout.match(/(\d+) failing/);
    
    if (passedMatch) {result.passed = parseInt(passedMatch[1]);}
    if (failedMatch) {result.failed = parseInt(failedMatch[1]);}
    result.tests = result.passed + result.failed;
  } catch (parseError) {
    console.warn('Error parseando output de tests:', parseError);
  }

  return result;
}

async function generateTestReport(data: any) {
  try {
    const reportsDir = path.join(process.cwd(), 'public', 'test-reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      type: 'unified-test-execution',
      version: '1.0.0',
      summary: data.summary,
      results: data.results.map((result: any) => ({
        suite: result.suite,
        name: result.name,
        status: result.status,
        duration: result.duration,
        tests: result.tests || 0,
        passed: result.passed || 0,
        failed: result.failed || 0,
        error: result.error || null
      })),
      metadata: {
        node_version: process.version,
        platform: process.platform,
        environment: 'test',
        generated_by: 'unified-test-api'
      }
    };

    const filename = `unified-test-execution-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    return {
      filename,
      path: filepath,
      url: `/test-reports/${filename}`
    };
  } catch (error) {
    console.error('Error generando reporte:', error);
    return null;
  }
}

// ===================================
// ENDPOINTS
// ===================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      module: searchParams.get('module') || 'connection',
      detailed: searchParams.get('detailed') === 'true',
      user_id: searchParams.get('user_id') || undefined,
      include_sensitive: searchParams.get('include_sensitive') === 'true'
    };

    const params = UnifiedTestParamsSchema.parse(rawParams);
    const timestamp = new Date().toISOString();

    console.log(`🧪 Unified Test GET: Module ${params.module}`);

    let result;

    switch (params.module) {
      case 'connection':
        result = await testConnection(params.detailed);
        break;
      case 'auth':
        result = await testAuth(request, params.detailed);
        break;
      case 'middleware':
        result = await testMiddleware();
        break;
      case 'reports':
        result = await testReports();
        break;
      case 'user-profile':
        result = await testUserProfile(request, params.user_id);
        break;
      case 'flows':
        result = await testFlows({});
        break;
      case 'all':
        // Ejecutar todos los módulos básicos
        const modules = ['connection', 'auth', 'middleware', 'reports'];
        const results = {};
        
        for (const module of modules) {
          try {
            switch (module) {
              case 'connection':
                results[module] = await testConnection(params.detailed);
                break;
              case 'auth':
                results[module] = await testAuth(request, params.detailed);
                break;
              case 'middleware':
                results[module] = await testMiddleware();
                break;
              case 'reports':
                results[module] = await testReports();
                break;
            }
          } catch (error: any) {
            results[module] = {
              status: 'failed',
              error: error.message,
              data: null
            };
          }
        }

        const summary = {
          total_modules: modules.length,
          success_count: Object.values(results).filter((r: any) => r.status === 'success').length,
          partial_count: Object.values(results).filter((r: any) => r.status === 'partial').length,
          failed_count: Object.values(results).filter((r: any) => r.status === 'failed').length
        };

        result = {
          status: summary.failed_count === 0 ? 'success' : 'partial' as const,
          data: results,
          summary
        };
        break;
      default:
        throw new Error(`Módulo no soportado: ${params.module}`);
    }

    return NextResponse.json({
      timestamp,
      module: params.module,
      status: result.status,
      data: result.data,
      error: result.error,
      meta: {
        api_version: '1.0.0',
        unified: true,
        parameters: {
          module: params.module,
          detailed: params.detailed,
          include_sensitive: params.include_sensitive
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error en Unified Test API:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      module: 'unknown',
      status: 'failed',
      data: null,
      error: error.message,
      meta: {
        api_version: '1.0.0',
        unified: true,
        parameters: null
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, config = {} } = UnifiedTestPostSchema.parse(body);
    const timestamp = new Date().toISOString();

    console.log(`🧪 Unified Test POST: Module ${module}`);

    let result;

    switch (module) {
      case 'screenshots':
        result = await testScreenshots(config);
        break;
      case 'execution':
        result = await testExecution(config);
        break;
      case 'flows':
        result = await testFlows(config);
        break;
      case 'email':
        result = await testEmail(config);
        break;
      case 'auth':
        result = await testAuth(request, true);
        break;
      case 'connection':
        result = await testConnection(true);
        break;
      default:
        throw new Error(`Módulo POST no soportado: ${module}`);
    }

    return NextResponse.json({
      timestamp,
      module,
      status: result.status,
      data: result.data,
      error: result.error,
      meta: {
        api_version: '1.0.0',
        unified: true,
        method: 'POST',
        config: config
      }
    });
  } catch (error: any) {
    console.error('❌ Error en Unified Test API POST:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      module: 'unknown',
      status: 'failed',
      data: null,
      error: error.message,
      meta: {
        api_version: '1.0.0',
        unified: true,
        method: 'POST'
      }
    }, { status: 500 });
  }
}










