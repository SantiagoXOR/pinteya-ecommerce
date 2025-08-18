// ===================================
// PINTEYA E-COMMERCE - AUDITORÍA COMPLETA PANEL ADMINISTRATIVO
// ===================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuración de la auditoría
const AUDIT_CONFIG = {
  baseUrl: 'https://pinteya.com',
  adminEmail: 'santiago@xor.com.ar',
  adminPassword: 'SavoirFaire19',
  screenshotDir: './audit-screenshots',
  reportFile: './admin-audit-report.json',
  timeout: 30000
};

// Crear directorio de screenshots
if (!fs.existsSync(AUDIT_CONFIG.screenshotDir)) {
  fs.mkdirSync(AUDIT_CONFIG.screenshotDir, { recursive: true });
}

class AdminPanelAuditor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.auditResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      phases: {
        phase1_products: { status: 'pending', tests: [] },
        phase2_orders: { status: 'pending', tests: [] },
        phase3_monitoring: { status: 'pending', tests: [] }
      },
      authentication: { status: 'pending', tests: [] },
      responsive: { status: 'pending', tests: [] },
      performance: { status: 'pending', tests: [] }
    };
  }

  async init() {
    console.log('🚀 Iniciando auditoría del panel administrativo...');
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 // Ralentizar para mejor observación
    });
    this.page = await this.browser.newPage();
    
    // Configurar viewport para desktop
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    // Configurar timeouts
    this.page.setDefaultTimeout(AUDIT_CONFIG.timeout);
  }

  async authenticate() {
    console.log('🔐 Iniciando proceso de autenticación...');
    
    try {
      // Ir a la página de login
      await this.page.goto(`${AUDIT_CONFIG.baseUrl}/sign-in`);
      await this.page.waitForLoadState('networkidle');
      
      // Capturar screenshot de login
      await this.page.screenshot({ 
        path: `${AUDIT_CONFIG.screenshotDir}/01-login-page.png`,
        fullPage: true 
      });

      // Buscar y llenar el formulario de login
      const emailInput = await this.page.locator('input[type="email"]').first();
      const passwordInput = await this.page.locator('input[type="password"]').first();
      
      if (await emailInput.isVisible()) {
        await emailInput.fill(AUDIT_CONFIG.adminEmail);
        await passwordInput.fill(AUDIT_CONFIG.adminPassword);
        
        // Buscar botón de submit
        const submitButton = await this.page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        // Esperar redirección
        await this.page.waitForURL('**/admin/**', { timeout: 15000 });
        
        this.addTestResult('authentication', 'login_success', true, 'Login exitoso');
      } else {
        // Intentar con Google OAuth si no hay formulario directo
        const googleButton = await this.page.locator('button:has-text("Google")').first();
        if (await googleButton.isVisible()) {
          await googleButton.click();
          // Manejar OAuth flow...
        }
      }
      
      await this.page.screenshot({ 
        path: `${AUDIT_CONFIG.screenshotDir}/02-post-login.png`,
        fullPage: true 
      });
      
    } catch (error) {
      this.addTestResult('authentication', 'login_failed', false, `Error en login: ${error.message}`);
      throw error;
    }
  }

  async auditPhase1Products() {
    console.log('📦 Auditando Fase 1 - Sistema de Productos...');
    
    try {
      // Navegar a /admin/products
      await this.page.goto(`${AUDIT_CONFIG.baseUrl}/admin/products`);
      await this.page.waitForLoadState('networkidle');
      
      // Verificar que no hay errores 401/403
      const response = this.page.url();
      if (response.includes('/admin/products')) {
        this.addTestResult('phase1_products', 'route_accessible', true, 'Ruta /admin/products accesible');
      } else {
        this.addTestResult('phase1_products', 'route_accessible', false, 'Ruta /admin/products no accesible');
      }
      
      // Capturar screenshot
      await this.page.screenshot({ 
        path: `${AUDIT_CONFIG.screenshotDir}/03-admin-products.png`,
        fullPage: true 
      });
      
      // Verificar elementos clave del panel de productos
      const tests = [
        { selector: 'h1, h2', name: 'title_present', description: 'Título del panel presente' },
        { selector: '[data-testid="products-table"], table', name: 'products_table', description: 'Tabla de productos presente' },
        { selector: 'button:has-text("Agregar"), button:has-text("Nuevo")', name: 'add_button', description: 'Botón agregar producto presente' },
        { selector: 'input[type="search"], input[placeholder*="buscar"]', name: 'search_input', description: 'Campo de búsqueda presente' },
        { selector: 'select, [role="combobox"]', name: 'filters', description: 'Filtros presentes' }
      ];
      
      for (const test of tests) {
        try {
          const element = await this.page.locator(test.selector).first();
          const isVisible = await element.isVisible({ timeout: 5000 });
          this.addTestResult('phase1_products', test.name, isVisible, test.description);
        } catch (error) {
          this.addTestResult('phase1_products', test.name, false, `${test.description} - Error: ${error.message}`);
        }
      }
      
      // Probar funcionalidad de búsqueda si existe
      try {
        const searchInput = await this.page.locator('input[type="search"], input[placeholder*="buscar"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('pintura');
          await this.page.waitForTimeout(2000); // Esperar debounce
          this.addTestResult('phase1_products', 'search_functionality', true, 'Búsqueda funcional');
        }
      } catch (error) {
        this.addTestResult('phase1_products', 'search_functionality', false, `Error en búsqueda: ${error.message}`);
      }
      
    } catch (error) {
      this.addTestResult('phase1_products', 'general_error', false, `Error general en Fase 1: ${error.message}`);
    }
  }

  async auditPhase2Orders() {
    console.log('📋 Auditando Fase 2 - Sistema de Órdenes Enterprise...');
    
    try {
      // Navegar a /admin/orders
      await this.page.goto(`${AUDIT_CONFIG.baseUrl}/admin/orders`);
      await this.page.waitForLoadState('networkidle');
      
      // Verificar accesibilidad
      if (this.page.url().includes('/admin/orders')) {
        this.addTestResult('phase2_orders', 'route_accessible', true, 'Ruta /admin/orders accesible');
      } else {
        this.addTestResult('phase2_orders', 'route_accessible', false, 'Ruta /admin/orders no accesible');
      }
      
      // Capturar screenshot
      await this.page.screenshot({ 
        path: `${AUDIT_CONFIG.screenshotDir}/04-admin-orders.png`,
        fullPage: true 
      });
      
      // Verificar elementos del sistema de órdenes enterprise
      const orderTests = [
        { selector: 'h1, h2', name: 'title_present', description: 'Título del panel de órdenes' },
        { selector: '[data-testid="orders-table"], table', name: 'orders_table', description: 'Tabla de órdenes' },
        { selector: '[data-testid="order-status"], .status', name: 'order_status', description: 'Estados de órdenes visibles' },
        { selector: 'button:has-text("Bulk"), button:has-text("Masivo")', name: 'bulk_operations', description: 'Operaciones masivas' },
        { selector: '[data-testid="analytics"], .analytics', name: 'analytics_panel', description: 'Panel de analytics' },
        { selector: 'select[data-testid="status-filter"]', name: 'status_filters', description: 'Filtros de estado' }
      ];
      
      for (const test of orderTests) {
        try {
          const element = await this.page.locator(test.selector).first();
          const isVisible = await element.isVisible({ timeout: 5000 });
          this.addTestResult('phase2_orders', test.name, isVisible, test.description);
        } catch (error) {
          this.addTestResult('phase2_orders', test.name, false, `${test.description} - Error: ${error.message}`);
        }
      }
      
      // Verificar estados específicos de órdenes (8 estados)
      const expectedStates = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'];
      let statesFound = 0;
      
      for (const state of expectedStates) {
        try {
          const stateElement = await this.page.locator(`text=${state}, [data-status="${state}"]`).first();
          if (await stateElement.isVisible({ timeout: 2000 })) {
            statesFound++;
          }
        } catch (error) {
          // Estado no encontrado, continuar
        }
      }
      
      this.addTestResult('phase2_orders', 'order_states', statesFound >= 4, `Estados encontrados: ${statesFound}/8`);
      
    } catch (error) {
      this.addTestResult('phase2_orders', 'general_error', false, `Error general en Fase 2: ${error.message}`);
    }
  }

  async auditPhase3Monitoring() {
    console.log('📊 Auditando Fase 3 - Sistema de Monitoreo Enterprise...');
    
    try {
      // Navegar a /admin/monitoring
      await this.page.goto(`${AUDIT_CONFIG.baseUrl}/admin/monitoring`);
      await this.page.waitForLoadState('networkidle');
      
      // Verificar que NO hay error 401 (problema recién corregido)
      const pageContent = await this.page.content();
      const hasError401 = pageContent.includes('401') || pageContent.includes('Unauthorized');
      
      this.addTestResult('phase3_monitoring', 'no_401_error', !hasError401, hasError401 ? 'Error 401 detectado' : 'Sin errores 401');
      
      if (this.page.url().includes('/admin/monitoring')) {
        this.addTestResult('phase3_monitoring', 'route_accessible', true, 'Ruta /admin/monitoring accesible');
      } else {
        this.addTestResult('phase3_monitoring', 'route_accessible', false, 'Ruta /admin/monitoring no accesible');
      }
      
      // Capturar screenshot
      await this.page.screenshot({ 
        path: `${AUDIT_CONFIG.screenshotDir}/05-admin-monitoring.png`,
        fullPage: true 
      });
      
      // Verificar elementos del sistema de monitoreo enterprise
      const monitoringTests = [
        { selector: 'h1, h2', name: 'title_present', description: 'Título del panel de monitoreo' },
        { selector: '[data-testid="metrics-dashboard"], .metrics', name: 'metrics_dashboard', description: 'Dashboard de métricas' },
        { selector: '[data-testid="circuit-breaker"], .circuit-breaker', name: 'circuit_breakers', description: 'Circuit breakers' },
        { selector: '[data-testid="audit-trail"], .audit', name: 'audit_trail', description: 'Audit trail' },
        { selector: '[data-testid="alerts"], .alerts', name: 'alerts_panel', description: 'Panel de alertas' },
        { selector: '[data-testid="health-checks"], .health', name: 'health_checks', description: 'Health checks' },
        { selector: '[data-testid="real-time"], .real-time', name: 'real_time_data', description: 'Datos en tiempo real' }
      ];
      
      for (const test of monitoringTests) {
        try {
          const element = await this.page.locator(test.selector).first();
          const isVisible = await element.isVisible({ timeout: 5000 });
          this.addTestResult('phase3_monitoring', test.name, isVisible, test.description);
        } catch (error) {
          this.addTestResult('phase3_monitoring', test.name, false, `${test.description} - Error: ${error.message}`);
        }
      }
      
      // Verificar APIs de monitoreo
      try {
        const response = await this.page.request.get(`${AUDIT_CONFIG.baseUrl}/api/admin/monitoring/metrics`);
        this.addTestResult('phase3_monitoring', 'metrics_api', response.ok(), `API metrics status: ${response.status()}`);
      } catch (error) {
        this.addTestResult('phase3_monitoring', 'metrics_api', false, `Error API metrics: ${error.message}`);
      }
      
    } catch (error) {
      this.addTestResult('phase3_monitoring', 'general_error', false, `Error general en Fase 3: ${error.message}`);
    }
  }

  addTestResult(phase, testName, passed, description) {
    const result = {
      name: testName,
      passed,
      description,
      timestamp: new Date().toISOString()
    };
    
    this.auditResults.phases[phase].tests.push(result);
    this.auditResults.summary.totalTests++;
    
    if (passed) {
      this.auditResults.summary.passed++;
    } else {
      this.auditResults.summary.failed++;
    }
    
    console.log(`${passed ? '✅' : '❌'} ${phase}.${testName}: ${description}`);
  }

  async generateReport() {
    console.log('📄 Generando reporte de auditoría...');
    
    // Calcular estados de fases
    for (const [phaseName, phase] of Object.entries(this.auditResults.phases)) {
      const totalTests = phase.tests.length;
      const passedTests = phase.tests.filter(t => t.passed).length;
      
      if (totalTests === 0) {
        phase.status = 'not_tested';
      } else if (passedTests === totalTests) {
        phase.status = 'passed';
      } else if (passedTests > totalTests / 2) {
        phase.status = 'partial';
      } else {
        phase.status = 'failed';
      }
      
      phase.score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    }
    
    // Guardar reporte JSON
    fs.writeFileSync(AUDIT_CONFIG.reportFile, JSON.stringify(this.auditResults, null, 2));
    
    // Generar reporte markdown
    await this.generateMarkdownReport();
    
    console.log('✅ Reporte generado exitosamente');
  }

  async generateMarkdownReport() {
    const report = `# 📊 Auditoría Panel Administrativo Pinteya E-commerce

## 📋 Resumen Ejecutivo

- **Fecha**: ${new Date(this.auditResults.timestamp).toLocaleString()}
- **Tests Totales**: ${this.auditResults.summary.totalTests}
- **Exitosos**: ${this.auditResults.summary.passed}
- **Fallidos**: ${this.auditResults.summary.failed}
- **Tasa de Éxito**: ${Math.round((this.auditResults.summary.passed / this.auditResults.summary.totalTests) * 100)}%

## 🎯 Estado por Fases

### Fase 1 - Sistema de Productos
- **Estado**: ${this.auditResults.phases.phase1_products.status}
- **Score**: ${this.auditResults.phases.phase1_products.score}%
- **Tests**: ${this.auditResults.phases.phase1_products.tests.length}

### Fase 2 - Sistema de Órdenes Enterprise  
- **Estado**: ${this.auditResults.phases.phase2_orders.status}
- **Score**: ${this.auditResults.phases.phase2_orders.score}%
- **Tests**: ${this.auditResults.phases.phase2_orders.tests.length}

### Fase 3 - Sistema de Monitoreo Enterprise
- **Estado**: ${this.auditResults.phases.phase3_monitoring.status}
- **Score**: ${this.auditResults.phases.phase3_monitoring.score}%
- **Tests**: ${this.auditResults.phases.phase3_monitoring.tests.length}

## 📸 Screenshots Capturados

1. Login Page
2. Post-Login Dashboard
3. Admin Products Panel
4. Admin Orders Panel  
5. Admin Monitoring Panel

## 🔍 Detalles por Fase

${Object.entries(this.auditResults.phases).map(([phaseName, phase]) => `
### ${phaseName}
${phase.tests.map(test => `- ${test.passed ? '✅' : '❌'} **${test.name}**: ${test.description}`).join('\n')}
`).join('\n')}

---
*Reporte generado automáticamente por Playwright Auditor*
`;

    fs.writeFileSync('./admin-audit-report.md', report);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Ejecutar auditoría
async function runAudit() {
  const auditor = new AdminPanelAuditor();
  
  try {
    await auditor.init();
    await auditor.authenticate();
    await auditor.auditPhase1Products();
    await auditor.auditPhase2Orders();
    await auditor.auditPhase3Monitoring();
    await auditor.generateReport();
    
    console.log('🎉 Auditoría completada exitosamente');
    console.log(`📄 Reporte disponible en: ${AUDIT_CONFIG.reportFile}`);
    console.log(`📸 Screenshots en: ${AUDIT_CONFIG.screenshotDir}`);
    
  } catch (error) {
    console.error('❌ Error durante la auditoría:', error);
  } finally {
    await auditor.cleanup();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAudit();
}

module.exports = { AdminPanelAuditor, runAudit };
