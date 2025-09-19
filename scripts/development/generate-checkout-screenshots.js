#!/usr/bin/env node

// ===================================
// SCRIPT PARA GENERAR SCREENSHOTS REALES DEL FLUJO DE CHECKOUT
// ===================================

const { chromium } = require('playwright');
const fs = require('fs/promises');
const path = require('path');

// Configuración
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotsDir: path.join(__dirname, '..', 'public', 'test-screenshots'),
  viewport: { width: 1920, height: 1080 },
  timeout: 30000,
  waitTime: 2000, // Tiempo de espera para que las páginas se estabilicen
  quality: 90 // Calidad de las imágenes PNG
};

// Pasos del flujo de checkout
const CHECKOUT_STEPS = [
  {
    id: 'setup-shop-page',
    name: 'Página de tienda cargada',
    url: '/shop',
    selector: '[data-testid="product-card"]',
    description: 'Usuario navega a la página de productos'
  },
  {
    id: 'setup-product-added',
    name: 'Producto agregado al carrito',
    url: '/shop',
    action: async (page) => {
      await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart-btn"]');
      await page.waitForTimeout(1000);
    },
    description: 'Usuario agrega un producto al carrito'
  },
  {
    id: 'step1-cart-sidebar',
    name: 'Sidebar del carrito abierto',
    url: '/shop',
    action: async (page) => {
      // Primero agregar producto
      await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart-btn"]');
      await page.waitForTimeout(500);
      // Luego abrir sidebar
      await page.click('[data-testid="cart-icon"]');
      await page.waitForTimeout(1000);
    },
    description: 'Sidebar del carrito con productos visibles'
  },
  {
    id: 'step1-checkout-transition',
    name: 'Transición a página de checkout',
    url: '/shop',
    action: async (page) => {
      // Agregar producto y abrir carrito
      await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart-btn"]');
      await page.waitForTimeout(500);
      await page.click('[data-testid="cart-icon"]');
      await page.waitForTimeout(500);
      // Hacer clic en checkout
      await page.click('[data-testid="checkout-btn"]');
      await page.waitForTimeout(1000);
    },
    description: 'Usuario hace clic en botón de checkout'
  },
  {
    id: 'step1-checkout-page',
    name: 'Página de checkout cargada',
    url: '/checkout',
    selector: '[data-testid="payer-info-section"]',
    description: 'Formulario de checkout completamente cargado'
  },
  {
    id: 'step2-form-initial',
    name: 'Formulario de checkout inicial',
    url: '/checkout',
    selector: '[data-testid="payer-info-section"]',
    description: 'Estado inicial del formulario de checkout'
  },
  {
    id: 'step2-form-sections',
    name: 'Secciones del formulario verificadas',
    url: '/checkout',
    action: async (page) => {
      // Resaltar secciones principales
      await page.evaluate(() => {
        const sections = [
          '[data-testid="payer-info-section"]',
          '[data-testid="shipping-info-section"]',
          '[data-testid="order-summary-section"]'
        ];
        sections.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            element.style.border = '2px solid #3b82f6';
            element.style.borderRadius = '8px';
          }
        });
      });
      await page.waitForTimeout(500);
    },
    description: 'Secciones principales del formulario resaltadas'
  },
  {
    id: 'step3-validation-errors',
    name: 'Errores de validación mostrados',
    url: '/checkout',
    action: async (page) => {
      // Intentar enviar formulario vacío para mostrar errores
      await page.click('[data-testid="submit-checkout-btn"]');
      await page.waitForTimeout(1000);
    },
    description: 'Errores de validación visibles en formulario vacío'
  },
  {
    id: 'step3-email-error',
    name: 'Error de email inválido',
    url: '/checkout',
    action: async (page) => {
      // Llenar email inválido
      await page.fill('input[name="payer.email"]', 'invalid-email');
      await page.click('[data-testid="submit-checkout-btn"]');
      await page.waitForTimeout(1000);
    },
    description: 'Error específico de validación de email'
  },
  {
    id: 'step4-personal-filled',
    name: 'Información personal completada',
    url: '/checkout',
    action: async (page) => {
      await page.fill('input[name="payer.name"]', 'Juan');
      await page.fill('input[name="payer.surname"]', 'Pérez');
      await page.fill('input[name="payer.email"]', 'juan@test.com');
      await page.fill('input[name="payer.phone"]', '1234567890');
      await page.waitForTimeout(500);
    },
    description: 'Campos de información personal completados'
  },
  {
    id: 'step4-address-filled',
    name: 'Dirección de envío completada',
    url: '/checkout',
    action: async (page) => {
      // Llenar información personal primero
      await page.fill('input[name="payer.name"]', 'Juan');
      await page.fill('input[name="payer.surname"]', 'Pérez');
      await page.fill('input[name="payer.email"]', 'juan@test.com');
      await page.fill('input[name="payer.phone"]', '1234567890');
      
      // Llenar dirección
      await page.fill('input[name="shipping.address.street_name"]', 'Av. Corrientes');
      await page.fill('input[name="shipping.address.street_number"]', '1234');
      await page.fill('input[name="shipping.address.zip_code"]', '1000');
      await page.fill('input[name="shipping.address.city_name"]', 'Buenos Aires');
      await page.fill('input[name="shipping.address.state_name"]', 'CABA');
      await page.waitForTimeout(500);
    },
    description: 'Formulario completo con dirección de envío'
  },
  {
    id: 'step4-pre-submit',
    name: 'Formulario completo antes del envío',
    url: '/checkout',
    action: async (page) => {
      // Llenar todo el formulario
      await page.fill('input[name="payer.name"]', 'Juan');
      await page.fill('input[name="payer.surname"]', 'Pérez');
      await page.fill('input[name="payer.email"]', 'juan@test.com');
      await page.fill('input[name="payer.phone"]', '1234567890');
      await page.fill('input[name="shipping.address.street_name"]', 'Av. Corrientes');
      await page.fill('input[name="shipping.address.street_number"]', '1234');
      await page.fill('input[name="shipping.address.zip_code"]', '1000');
      await page.fill('input[name="shipping.address.city_name"]', 'Buenos Aires');
      await page.fill('input[name="shipping.address.state_name"]', 'CABA');
      
      // Resaltar botón de envío
      await page.evaluate(() => {
        const button = document.querySelector('[data-testid="submit-checkout-btn"]');
        if (button) {
          button.style.border = '3px solid #10b981';
          button.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.5)';
        }
      });
      await page.waitForTimeout(500);
    },
    description: 'Formulario completamente listo para envío'
  }
];

async function createDirectories() {
  try {
    await fs.mkdir(CONFIG.screenshotsDir, { recursive: true });

    // Crear también directorio de thumbnails
    const thumbsDir = path.join(CONFIG.screenshotsDir, 'thumbs');
    await fs.mkdir(thumbsDir, { recursive: true });

    console.log(`📁 Directorios creados:`);
    console.log(`   - ${CONFIG.screenshotsDir}`);
    console.log(`   - ${thumbsDir}`);
  } catch (error) {
    console.error('Error creando directorios:', error);
  }
}

async function captureScreenshot(page, step) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${step.id}-${timestamp}.png`;
    const filepath = path.join(CONFIG.screenshotsDir, filename);

    console.log(`📸 Capturando: ${step.name}...`);

    // Navegar a la URL si es necesario
    if (step.url) {
      await page.goto(`${CONFIG.baseUrl}${step.url}`, { 
        waitUntil: 'networkidle',
        timeout: CONFIG.timeout 
      });
    }

    // Esperar selector específico si se define
    if (step.selector) {
      await page.waitForSelector(step.selector, { timeout: 10000 });
    }

    // Ejecutar acción personalizada si se define
    if (step.action) {
      await step.action(page);
    }

    // Capturar screenshot
    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png'
    });

    console.log(`✅ Screenshot guardado: ${filename}`);
    return {
      id: step.id,
      filename,
      path: filepath,
      url: `/test-screenshots/${filename}`,
      step: step.name,
      description: step.description
    };

  } catch (error) {
    console.error(`❌ Error capturando ${step.name}:`, error.message);
    return null;
  }
}

async function generateAllScreenshots() {
  console.log('🚀 Iniciando generación de screenshots del flujo de checkout...');
  
  await createDirectories();

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({
    viewport: CONFIG.viewport
  });

  const results = [];

  try {
    for (const step of CHECKOUT_STEPS) {
      const result = await captureScreenshot(page, step);
      if (result) {
        results.push(result);
      }
      
      // Pausa entre screenshots
      await page.waitForTimeout(1000);
    }

    console.log(`\n🎉 Generación completada: ${results.length}/${CHECKOUT_STEPS.length} screenshots`);
    
    // Guardar metadata
    const metadata = {
      generated: new Date().toISOString(),
      total: results.length,
      screenshots: results
    };
    
    const metadataPath = path.join(CONFIG.screenshotsDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`📄 Metadata guardada: ${metadataPath}`);

  } finally {
    await browser.close();
  }

  return results;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateAllScreenshots()
    .then(results => {
      console.log('\n📊 Resumen:');
      results.forEach(result => {
        console.log(`  ✅ ${result.step}: ${result.filename}`);
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error general:', error);
      process.exit(1);
    });
}

module.exports = { generateAllScreenshots, CHECKOUT_STEPS, CONFIG };
