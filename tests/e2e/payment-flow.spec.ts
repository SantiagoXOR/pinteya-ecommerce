// ===================================
// PINTEYA E-COMMERCE - TESTS E2E FLUJO DE PAGOS
// ===================================

import { test, expect, Page } from '@playwright/test';

// Configuración de test
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  testProduct: {
    name: 'Látex Interior Blanco 20lts',
    price: '$20.250',
    id: 'test-product-1'
  },
  testUser: {
    email: 'test@pinteya.com',
    name: 'Usuario Test',
    dni: '12345678'
  },
  mercadoPagoTestCards: {
    approved: {
      number: '4509 9535 6623 3704',
      cvv: '123',
      expiry: '11/25',
      name: 'APRO APRO'
    },
    rejected: {
      number: '4013 5406 8274 6260',
      cvv: '123', 
      expiry: '11/25',
      name: 'OTHE OTHE'
    }
  }
};

test.describe('Flujo Completo de Pagos - MercadoPago', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar timeout extendido para operaciones de pago
    test.setTimeout(60000);
    
    // Navegar a la página principal
    await page.goto(TEST_CONFIG.baseUrl);
    
    // Esperar que la página cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test('Flujo completo: Agregar producto → Checkout → Pago exitoso', async ({ page }) => {
    // PASO 1: Verificar que hay productos en el carrito (ya hay uno cargado)
    await test.step('Verificar carrito con productos', async () => {
      // Verificar que el carrito tiene productos
      await expect(page.locator('button:has-text("Carrito")')).toBeVisible();

      // Verificar que muestra "1" en el contador del carrito
      await expect(page.locator('text="1"')).toBeVisible();

      // Opcional: Agregar otro producto si es necesario
      const addToCartButtons = page.locator('button:has-text("Agregar al carrito")');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(1000); // Esperar que se procese
      }
    });

    // PASO 2: Ir al checkout
    await test.step('Navegar al checkout', async () => {
      // Hacer clic en el botón "Finalizar Compra"
      await page.click('button:has-text("Finalizar Compra")');

      // Esperar a que cargue la página de checkout
      await page.waitForLoadState('networkidle');

      // Verificar que estamos en la página de checkout
      await expect(page.url()).toContain('/checkout');
    });

    // PASO 3: Completar información de envío
    await test.step('Completar información de envío', async () => {
      // Llenar formulario de envío
      await page.fill('[data-testid="shipping-name"]', TEST_CONFIG.testUser.name);
      await page.fill('[data-testid="shipping-email"]', TEST_CONFIG.testUser.email);
      await page.fill('[data-testid="shipping-address"]', 'Av. Córdoba 1234');
      await page.fill('[data-testid="shipping-city"]', 'Córdoba');
      await page.fill('[data-testid="shipping-postal-code"]', '5000');
      
      // Continuar al pago
      await page.click('[data-testid="continue-to-payment"]');
    });

    // PASO 4: Procesar pago con MercadoPago
    await test.step('Procesar pago con MercadoPago', async () => {
      // Esperar que aparezca el botón de MercadoPago
      await page.waitForSelector('[data-testid="mercadopago-button"]');
      
      // Hacer clic en pagar con MercadoPago
      await page.click('[data-testid="mercadopago-button"]');
      
      // Esperar redirección a MercadoPago (o mock)
      await page.waitForLoadState('networkidle');
      
      // Si estamos en modo mock, verificar la página de mock
      const currentUrl = page.url();
      if (currentUrl.includes('/mock/mercadopago/checkout')) {
        // Estamos en el mock de MercadoPago
        await expect(page.locator('h1')).toContainText('Checkout de Prueba - MercadoPago Mock');
        
        // Llenar datos de tarjeta de prueba (aprobada)
        await page.fill('[data-testid="card-number"]', TEST_CONFIG.mercadoPagoTestCards.approved.number);
        await page.fill('[data-testid="card-expiry"]', TEST_CONFIG.mercadoPagoTestCards.approved.expiry);
        await page.fill('[data-testid="card-cvv"]', TEST_CONFIG.mercadoPagoTestCards.approved.cvv);
        await page.fill('[data-testid="card-name"]', TEST_CONFIG.mercadoPagoTestCards.approved.name);
        await page.fill('[data-testid="card-dni"]', TEST_CONFIG.testUser.dni);
        
        // Procesar pago
        await page.click('[data-testid="pay-button"]');
        
      } else {
        // Estamos en MercadoPago real (sandbox)
        // Aquí manejaríamos el flujo real de MercadoPago
        await expect(page.locator('body')).toContainText('MercadoPago');
        
        // TODO: Implementar manejo del flujo real de MercadoPago sandbox
        console.log('Flujo real de MercadoPago detectado - implementar según necesidades');
      }
    });

    // PASO 5: Verificar confirmación de pago
    await test.step('Verificar confirmación de pago exitoso', async () => {
      // Esperar redirección a página de éxito
      await page.waitForURL('**/checkout/success**');
      
      // Verificar mensaje de éxito
      await expect(page.locator('h1')).toContainText('¡Pago Exitoso!');
      await expect(page.locator('[data-testid="payment-status"]')).toContainText('Aprobado y procesado');
      
      // Verificar que se muestra el ID de la orden
      await expect(page.locator('[data-testid="order-id"]')).toBeVisible();
      
      // Verificar próximos pasos
      await expect(page.locator('[data-testid="next-steps"]')).toContainText('Confirmación por email');
    });
  });

  test('Flujo de pago rechazado', async ({ page }) => {
    // Similar al flujo anterior pero usando tarjeta rechazada
    await test.step('Agregar producto y llegar al pago', async () => {
      // Reutilizar pasos 1-3 del test anterior
      // (código simplificado para brevedad)
      await page.goto(`${TEST_CONFIG.baseUrl}/checkout`);
    });

    await test.step('Procesar pago rechazado', async () => {
      await page.click('[data-testid="mercadopago-button"]');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/mock/mercadopago/checkout')) {
        // Usar tarjeta rechazada
        await page.fill('[data-testid="card-number"]', TEST_CONFIG.mercadoPagoTestCards.rejected.number);
        await page.fill('[data-testid="card-expiry"]', TEST_CONFIG.mercadoPagoTestCards.rejected.expiry);
        await page.fill('[data-testid="card-cvv"]', TEST_CONFIG.mercadoPagoTestCards.rejected.cvv);
        await page.fill('[data-testid="card-name"]', TEST_CONFIG.mercadoPagoTestCards.rejected.name);
        await page.fill('[data-testid="card-dni"]', TEST_CONFIG.testUser.dni);
        
        await page.click('[data-testid="pay-button"]');
      }
    });

    await test.step('Verificar manejo de pago rechazado', async () => {
      // Esperar redirección a página de fallo
      await page.waitForURL('**/checkout/failure**');
      
      // Verificar mensaje de error
      await expect(page.locator('h1')).toContainText('Pago Rechazado');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      // Verificar opción de reintentar
      await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
    });
  });

  test('Validación de webhook de MercadoPago', async ({ page, request }) => {
    // Test para validar que el webhook procesa correctamente las notificaciones
    await test.step('Simular webhook de MercadoPago', async () => {
      const webhookPayload = {
        action: 'payment.updated',
        api_version: 'v1',
        data: {
          id: 'test-payment-123'
        },
        date_created: new Date().toISOString(),
        id: 123456,
        live_mode: false,
        type: 'payment',
        user_id: 'test-user'
      };

      // Enviar webhook al endpoint
      const response = await request.post(`${TEST_CONFIG.baseUrl}/api/payments/webhook`, {
        data: webhookPayload,
        headers: {
          'Content-Type': 'application/json',
          'x-signature': 'test-signature',
          'x-request-id': 'test-request-123'
        }
      });

      // Verificar respuesta del webhook
      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('status');
    });
  });

  test('Performance del flujo de checkout', async ({ page }) => {
    // Test de performance para asegurar tiempos de respuesta aceptables
    await test.step('Medir tiempos de carga del checkout', async () => {
      const startTime = Date.now();
      
      await page.goto(`${TEST_CONFIG.baseUrl}/checkout`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Verificar que la página carga en menos de 3 segundos
      expect(loadTime).toBeLessThan(3000);
    });

    await test.step('Medir tiempo de respuesta de API de preferencias', async () => {
      const startTime = Date.now();
      
      const response = await page.request.post(`${TEST_CONFIG.baseUrl}/api/payments/create-preference`, {
        data: {
          items: [{
            id: 'test-1',
            title: 'Producto Test',
            quantity: 1,
            unit_price: 100,
            currency_id: 'ARS'
          }],
          external_reference: 'test-order-123'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      // Verificar que la API responde en menos de 2 segundos
      expect(responseTime).toBeLessThan(2000);
      expect(response.status()).toBe(200);
    });
  });
});
