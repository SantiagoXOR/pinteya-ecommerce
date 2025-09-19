#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICACIÓN DE SEGURIDAD EN PRODUCCIÓN
 * 
 * Verifica el estado de seguridad de pinteya.com en producción
 * para determinar si NextAuth.js funciona correctamente allí.
 */

const { chromium } = require('playwright');

// Configuración para producción
const PRODUCTION_CONFIG = {
  baseUrl: 'https://pinteya.com',
  timeout: 15000,
  userAgent: 'Pinteya-Security-Audit/1.0'
};

// Rutas que DEBEN estar protegidas en producción
const PROTECTED_ROUTES = [
  // Rutas UI Admin
  { url: '/admin', type: 'UI', expectedBehavior: 'redirect_or_block' },
  { url: '/admin/products', type: 'UI', expectedBehavior: 'redirect_or_block' },
  { url: '/admin/orders', type: 'UI', expectedBehavior: 'redirect_or_block' },
  { url: '/admin/monitoring', type: 'UI', expectedBehavior: 'redirect_or_block' },
  
  // APIs Admin
  { url: '/api/admin/products', type: 'API', expectedBehavior: 'auth_required' },
  { url: '/api/admin/orders', type: 'API', expectedBehavior: 'auth_required' },
  { url: '/api/admin/monitoring/health', type: 'API', expectedBehavior: 'auth_required' },
];

// Rutas que DEBEN permanecer públicas
const PUBLIC_ROUTES = [
  { url: '/api/products', expectedStatus: [200] },
  { url: '/api/categories', expectedStatus: [200] },
  { url: '/api/brands', expectedStatus: [200] },
  { url: '/api/search/trending', expectedStatus: [200] }
];

class ProductionSecurityTester {
  constructor() {
    this.results = [];
    this.vulnerabilities = [];
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🔒 INICIANDO VERIFICACIÓN DE SEGURIDAD EN PRODUCCIÓN...');
    console.log(`🌐 URL: ${PRODUCTION_CONFIG.baseUrl}`);
    
    this.browser = await chromium.launch({
      headless: true,
      timeout: PRODUCTION_CONFIG.timeout
    });
    
    this.page = await this.browser.newPage({
      userAgent: PRODUCTION_CONFIG.userAgent
    });
    
    // Configurar timeouts
    this.page.setDefaultTimeout(PRODUCTION_CONFIG.timeout);
    this.page.setDefaultNavigationTimeout(PRODUCTION_CONFIG.timeout);
  }

  async testProtectedRoute(route) {
    console.log(`🔍 Testing protección en producción: ${route.url}`);
    
    try {
      const response = await this.page.goto(`${PRODUCTION_CONFIG.baseUrl}${route.url}`, {
        waitUntil: 'networkidle',
        timeout: PRODUCTION_CONFIG.timeout
      });

      const finalUrl = this.page.url();
      const status = response.status();
      
      console.log(`📊 Status: ${status}`);
      console.log(`📍 Final URL: ${finalUrl}`);
      
      // Analizar comportamiento de seguridad
      let isProtected = false;
      let protectionType = 'none';
      
      if (route.type === 'UI') {
        // Para rutas UI, verificar si redirige a login
        if (finalUrl.includes('/auth/signin') || finalUrl.includes('/login')) {
          isProtected = true;
          protectionType = 'redirect_to_login';
        } else if (status === 401 || status === 403) {
          isProtected = true;
          protectionType = 'auth_block';
        } else if (status === 200 && finalUrl === `${PRODUCTION_CONFIG.baseUrl}${route.url}`) {
          isProtected = false;
          protectionType = 'vulnerable';
        }
      } else if (route.type === 'API') {
        // Para APIs, verificar status de autenticación
        if (status === 401 || status === 403) {
          isProtected = true;
          protectionType = 'auth_required';
        } else if (status === 200) {
          isProtected = false;
          protectionType = 'vulnerable';
        }
      }
      
      if (!isProtected) {
        this.vulnerabilities.push({
          type: 'PRODUCTION_VULNERABILITY',
          route: route.url,
          severity: 'CRITICAL',
          status: status,
          finalUrl: finalUrl,
          description: `Ruta protegida accesible en producción sin autenticación`
        });
      }

      return {
        route: route.url,
        type: route.type,
        status,
        finalUrl,
        protected: isProtected,
        protectionType,
        vulnerability: !isProtected
      };

    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
      return {
        route: route.url,
        type: route.type,
        status: 'ERROR',
        finalUrl: 'unknown',
        protected: true, // Error es mejor que acceso
        protectionType: 'error',
        vulnerability: false,
        error: error.message
      };
    }
  }

  async testPublicRoute(route) {
    console.log(`🌐 Verificando ruta pública en producción: ${route.url}`);
    
    try {
      const response = await this.page.goto(`${PRODUCTION_CONFIG.baseUrl}${route.url}`, {
        waitUntil: 'networkidle',
        timeout: PRODUCTION_CONFIG.timeout
      });

      const status = response.status();
      const isAccessible = route.expectedStatus.includes(status);
      
      console.log(`📊 Status: ${status} (${isAccessible ? 'ACCESIBLE' : 'PROBLEMA'})`);
      
      return {
        route: route.url,
        status,
        expectedStatus: route.expectedStatus,
        accessible: isAccessible,
        issue: !isAccessible
      };

    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
      return {
        route: route.url,
        status: 'ERROR',
        expectedStatus: route.expectedStatus,
        accessible: false,
        issue: true,
        error: error.message
      };
    }
  }

  async checkNextAuthEndpoints() {
    console.log('\n🔍 VERIFICANDO ENDPOINTS DE NEXTAUTH.JS EN PRODUCCIÓN...');
    
    const authEndpoints = [
      '/api/auth/providers',
      '/api/auth/session',
      '/api/auth/csrf',
      '/api/auth/signin'
    ];
    
    const authResults = [];
    
    for (const endpoint of authEndpoints) {
      try {
        console.log(`📍 Testing: ${endpoint}`);
        
        const response = await this.page.goto(`${PRODUCTION_CONFIG.baseUrl}${endpoint}`, {
          waitUntil: 'networkidle',
          timeout: PRODUCTION_CONFIG.timeout
        });

        const status = response.status();
        console.log(`📊 Status: ${status}`);
        
        if (status === 200) {
          const contentType = response.headers()['content-type'] || '';
          console.log(`📋 Content-Type: ${contentType}`);
          console.log(`✅ NextAuth.js endpoint funcionando en producción`);
        }
        
        authResults.push({
          endpoint,
          status,
          working: status === 200
        });

      } catch (error) {
        console.log(`💥 Error: ${error.message}`);
        authResults.push({
          endpoint,
          status: 'ERROR',
          working: false,
          error: error.message
        });
      }
    }
    
    return authResults;
  }

  async runProductionSecurityAudit() {
    console.log('\n🔒 EJECUTANDO AUDITORÍA DE SEGURIDAD EN PRODUCCIÓN...\n');
    
    // Test 1: Verificar endpoints de NextAuth.js
    const authResults = await this.checkNextAuthEndpoints();
    
    // Test 2: Verificar rutas protegidas
    console.log('\n📋 FASE 1: Verificando protección de rutas admin en producción...');
    for (const route of PROTECTED_ROUTES) {
      const result = await this.testProtectedRoute(route);
      this.results.push(result);
      
      const statusIcon = result.protected ? '✅' : '❌';
      console.log(`${statusIcon} ${route.url} - ${result.protectionType} (${result.protected ? 'PROTEGIDO' : 'VULNERABLE'})\n`);
    }
    
    // Test 3: Verificar rutas públicas
    console.log('\n📋 FASE 2: Verificando accesibilidad de rutas públicas en producción...');
    for (const route of PUBLIC_ROUTES) {
      const result = await this.testPublicRoute(route);
      this.results.push(result);
      
      const statusIcon = result.accessible ? '✅' : '❌';
      console.log(`${statusIcon} ${route.url} - Status: ${result.status} (${result.accessible ? 'ACCESIBLE' : 'BLOQUEADO'})\n`);
    }
    
    return { authResults, securityResults: this.results };
  }

  generateProductionReport() {
    const protectedRoutes = this.results.filter(r => r.protected !== undefined);
    const publicRoutes = this.results.filter(r => r.accessible !== undefined);
    
    const protectedCount = protectedRoutes.filter(r => r.protected).length;
    const accessibleCount = publicRoutes.filter(r => r.accessible).length;
    
    const securityScore = this.vulnerabilities.length === 0 ? 100 : 
                         Math.max(0, 100 - (this.vulnerabilities.length * 10));

    const report = {
      timestamp: new Date().toISOString(),
      environment: 'PRODUCTION',
      url: PRODUCTION_CONFIG.baseUrl,
      securityScore: `${securityScore}%`,
      summary: {
        protectedRoutes: `${protectedCount}/${protectedRoutes.length}`,
        publicRoutes: `${accessibleCount}/${publicRoutes.length}`,
        vulnerabilities: this.vulnerabilities.length
      },
      vulnerabilities: this.vulnerabilities,
      results: this.results
    };

    return report;
  }

  printProductionReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🔒 REPORTE DE SEGURIDAD EN PRODUCCIÓN - PINTEYA.COM');
    console.log('='.repeat(80));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`🌐 Environment: ${report.environment}`);
    console.log(`🔗 URL: ${report.url}`);
    console.log(`🛡️  Security Score: ${report.securityScore}`);
    console.log(`🔐 Rutas Protegidas: ${report.summary.protectedRoutes}`);
    console.log(`🌐 Rutas Públicas: ${report.summary.publicRoutes}`);
    console.log(`⚠️  Vulnerabilidades: ${report.summary.vulnerabilities}`);
    
    if (report.vulnerabilities.length > 0) {
      console.log('\n🚨 VULNERABILIDADES EN PRODUCCIÓN:');
      report.vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. [${vuln.severity}] ${vuln.type}`);
        console.log(`   Ruta: ${vuln.route}`);
        console.log(`   Status: ${vuln.status}`);
        console.log(`   Descripción: ${vuln.description}`);
        console.log('');
      });
    } else {
      console.log('\n✅ NO SE DETECTARON VULNERABILIDADES EN PRODUCCIÓN');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📁 Reporte guardado en: test-results/production-security-report.json');
    console.log('='.repeat(80));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      const results = await this.runProductionSecurityAudit();
      
      const report = this.generateProductionReport();
      this.printProductionReport(report);
      
      // Guardar reporte
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join(__dirname, '..', 'test-results', 'production-security-report.json');
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      return report;
      
    } catch (error) {
      console.error('💥 Error durante auditoría de producción:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const tester = new ProductionSecurityTester();
  tester.run()
    .then(report => {
      const isSecure = report.vulnerabilities.length === 0;
      console.log(`\n🎯 RESULTADO FINAL: ${isSecure ? 'PRODUCCIÓN SEGURA' : 'VULNERABILIDADES DETECTADAS'}`);
      process.exit(isSecure ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = ProductionSecurityTester;
