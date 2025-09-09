/**
 * Script de Verificación de Funcionalidades Faltantes
 * 
 * Este script verifica específicamente las funcionalidades que fallaron
 * en la prueba integral: campo de observaciones y APIs de órdenes.
 */

const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

class MissingFeaturesVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      observationsField: null,
      orderAPIs: [],
      recommendations: []
    };
  }

  async init() {
    console.log('🔍 Verificando funcionalidades faltantes...');
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async verifyObservationsField() {
    console.log('\n📝 Verificando campo de observaciones...');
    
    try {
      // Navegar al checkout
      await this.page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
      
      // Buscar diferentes variantes del campo de observaciones
      const selectors = [
        'textarea[name="observations"]',
        'textarea[placeholder*="observaciones"]',
        'textarea[placeholder*="Observaciones"]',
        'input[name="observations"]',
        'input[placeholder*="observaciones"]',
        '#observations',
        '.observations',
        'textarea[id*="observ"]',
        'input[id*="observ"]'
      ];
      
      let fieldFound = false;
      let fieldDetails = null;
      
      for (const selector of selectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            fieldFound = true;
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            const placeholder = await element.evaluate(el => el.placeholder || '');
            const name = await element.evaluate(el => el.name || '');
            const id = await element.evaluate(el => el.id || '');
            
            fieldDetails = {
              selector,
              tagName,
              placeholder,
              name,
              id,
              visible: await element.isVisible()
            };
            
            console.log(`✅ Campo encontrado: ${selector}`);
            console.log(`   - Tag: ${tagName}`);
            console.log(`   - Placeholder: "${placeholder}"`);
            console.log(`   - Name: "${name}"`);
            console.log(`   - ID: "${id}"`);
            console.log(`   - Visible: ${fieldDetails.visible}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!fieldFound) {
        console.log('❌ Campo de observaciones NO encontrado');
        
        // Verificar si existe algún textarea o input relacionado
        const allTextareas = await this.page.$$('textarea');
        const allInputs = await this.page.$$('input[type="text"], input:not([type])');
        
        console.log(`   - Total textareas en la página: ${allTextareas.length}`);
        console.log(`   - Total inputs de texto: ${allInputs.length}`);
        
        // Listar todos los campos de formulario
        const formFields = await this.page.evaluate(() => {
          const fields = [];
          document.querySelectorAll('input, textarea, select').forEach(field => {
            fields.push({
              tag: field.tagName.toLowerCase(),
              type: field.type || 'text',
              name: field.name || '',
              id: field.id || '',
              placeholder: field.placeholder || '',
              className: field.className || ''
            });
          });
          return fields;
        });
        
        console.log('\n📋 Campos de formulario encontrados:');
        formFields.forEach((field, index) => {
          console.log(`   ${index + 1}. <${field.tag}> type="${field.type}" name="${field.name}" id="${field.id}" placeholder="${field.placeholder}"`);
        });
        
        this.results.recommendations.push(
          'IMPLEMENTAR: Agregar campo de observaciones al formulario de checkout',
          'SUGERENCIA: <textarea name="observations" placeholder="Observaciones (barrio, características de casa, horarios)" rows="3"></textarea>'
        );
      }
      
      this.results.observationsField = {
        found: fieldFound,
        details: fieldDetails
      };
      
    } catch (error) {
      console.log(`❌ Error verificando campo de observaciones: ${error.message}`);
      this.results.observationsField = {
        found: false,
        error: error.message
      };
    }
  }

  async verifyOrderAPIs() {
    console.log('\n🌐 Verificando APIs de órdenes...');
    
    const orderEndpoints = [
      { path: '/orders', method: 'GET', description: 'Listar órdenes' },
      { path: '/orders/create', method: 'POST', description: 'Crear orden' },
      { path: '/checkout/validate', method: 'POST', description: 'Validar checkout' },
      { path: '/admin/orders', method: 'GET', description: 'Panel admin de órdenes' }
    ];
    
    for (const endpoint of orderEndpoints) {
      try {
        const config = {
          method: endpoint.method,
          url: `${API_BASE}${endpoint.path}`,
          timeout: 5000,
          validateStatus: () => true // No lanzar error por status codes
        };
        
        if (endpoint.method === 'POST') {
          config.data = { test: true };
          config.headers = { 'Content-Type': 'application/json' };
        }
        
        const response = await axios(config);
        
        const result = {
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          status: response.status,
          exists: response.status !== 404,
          needsAuth: response.status === 401 || response.status === 403,
          error: response.status >= 400 ? response.statusText : null
        };
        
        this.results.orderAPIs.push(result);
        
        if (result.exists) {
          console.log(`✅ ${endpoint.method} ${endpoint.path} - Status: ${result.status} (${result.description})`);
        } else {
          console.log(`❌ ${endpoint.method} ${endpoint.path} - NO EXISTE (${result.description})`);
          this.results.recommendations.push(
            `IMPLEMENTAR: API ${endpoint.method} ${endpoint.path} - ${result.description}`
          );
        }
        
      } catch (error) {
        console.log(`❌ Error probando ${endpoint.path}: ${error.message}`);
        this.results.orderAPIs.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          error: error.message,
          exists: false
        });
      }
    }
  }

  async checkExistingFiles() {
    console.log('\n📁 Verificando archivos existentes...');
    
    const filesToCheck = [
      'src/app/api/orders/route.ts',
      'src/app/api/orders/create/route.ts',
      'src/app/api/checkout/validate/route.ts',
      'src/app/admin/orders/page.tsx',
      'src/components/Orders/',
      'src/types/order.ts'
    ];
    
    const existingFiles = [];
    const missingFiles = [];
    
    for (const file of filesToCheck) {
      const fullPath = `C:\\Users\\marti\\Desktop\\DESARROLLOSW\\BOILERPLATTE E-COMMERCE\\${file}`;
      try {
        if (fs.existsSync(fullPath)) {
          existingFiles.push(file);
          console.log(`✅ Existe: ${file}`);
        } else {
          missingFiles.push(file);
          console.log(`❌ Falta: ${file}`);
        }
      } catch (error) {
        missingFiles.push(file);
        console.log(`❌ Error verificando ${file}: ${error.message}`);
      }
    }
    
    this.results.files = {
      existing: existingFiles,
      missing: missingFiles
    };
    
    if (missingFiles.length > 0) {
      this.results.recommendations.push(
        'CREAR: Archivos faltantes para el sistema de órdenes',
        ...missingFiles.map(file => `  - ${file}`)
      );
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        observationsFieldFound: this.results.observationsField?.found || false,
        orderAPIsWorking: this.results.orderAPIs.filter(api => api.exists).length,
        totalOrderAPIs: this.results.orderAPIs.length,
        totalRecommendations: this.results.recommendations.length
      },
      details: this.results,
      nextSteps: {
        priority1: 'Implementar campo de observaciones en el checkout',
        priority2: 'Crear APIs de órdenes (/orders, /orders/create)',
        priority3: 'Implementar panel de administración de órdenes',
        priority4: 'Agregar validación de checkout'
      }
    };
    
    // Guardar reporte
    const reportPath = `verification-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 REPORTE DE VERIFICACIÓN');
    console.log('============================');
    console.log(`📝 Campo observaciones: ${report.summary.observationsFieldFound ? '✅ Encontrado' : '❌ Faltante'}`);
    console.log(`🌐 APIs de órdenes: ${report.summary.orderAPIsWorking}/${report.summary.totalOrderAPIs} funcionando`);
    console.log(`📋 Recomendaciones: ${report.summary.totalRecommendations}`);
    
    if (this.results.recommendations.length > 0) {
      console.log('\n🔧 RECOMENDACIONES:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log(`\n💾 Reporte guardado en: ${reportPath}`);
    
    return report;
  }

  async run() {
    try {
      await this.init();
      await this.verifyObservationsField();
      await this.verifyOrderAPIs();
      await this.checkExistingFiles();
      
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('\n💥 ERROR EN VERIFICACIÓN:', error.message);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Ejecutar verificación
if (require.main === module) {
  const verifier = new MissingFeaturesVerifier();
  verifier.run()
    .then(report => {
      console.log('\n✨ Verificación completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Verificación falló:', error.message);
      process.exit(1);
    });
}

module.exports = MissingFeaturesVerifier;