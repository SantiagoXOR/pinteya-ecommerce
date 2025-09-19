// ===================================
// TESTS E2E - REGISTRO Y COMPRA DE USUARIO
// Flujo completo desde registro hasta compra
// ===================================

import { test, expect, Page } from '@playwright/test';

// Configuración de datos de prueba
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Usuario Test E2E',
  phone: '+54 11 1234-5678'
};

const shippingAddress = {
  street: 'Av. Corrientes 1234',
  city: 'Buenos Aires',
  state: 'CABA',
  postalCode: '1043',
  country: 'Argentina'
};

// Helpers
const fillRegistrationForm = async (page: Page) => {
  await page.fill('[data-testid="register-email"]', testUser.email);
  await page.fill('[data-testid="register-password"]', testUser.password);
  await page.fill('[data-testid="register-confirm-password"]', testUser.password);
  await page.fill('[data-testid="register-full-name"]', testUser.fullName);
  await page.fill('[data-testid="register-phone"]', testUser.phone);
};

const addProductToCart = async (page: Page, productName: string = 'Producto Test') => {
  // Ir a la página de productos
  await page.goto('/products');
  
  // Buscar y hacer click en el primer producto
  await page.click(`[data-testid="product-card"]:has-text("${productName}") >> first`);
  
  // Esperar a que cargue la página del producto
  await page.waitForSelector('[data-testid="add-to-cart-btn"]');
  
  // Agregar al carrito
  await page.click('[data-testid="add-to-cart-btn"]');
  
  // Verificar que se agregó al carrito
  await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
};

const fillShippingForm = async (page: Page) => {
  await page.fill('[data-testid="shipping-street"]', shippingAddress.street);
  await page.fill('[data-testid="shipping-city"]', shippingAddress.city);
  await page.fill('[data-testid="shipping-state"]', shippingAddress.state);
  await page.fill('[data-testid="shipping-postal-code"]', shippingAddress.postalCode);
  await page.selectOption('[data-testid="shipping-country"]', shippingAddress.country);
};

test.describe('Flujo Completo: Registro → Compra', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage y cookies
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('debe completar el flujo completo de registro y compra', async ({ page }) => {
    // ===== PASO 1: REGISTRO =====
    await page.goto('/register');
    
    // Verificar que estamos en la página de registro
    await expect(page.locator('h1')).toContainText('Crear Cuenta');
    
    // Llenar formulario de registro
    await fillRegistrationForm(page);
    
    // Aceptar términos y condiciones
    await page.check('[data-testid="accept-terms"]');
    
    // Enviar formulario
    await page.click('[data-testid="register-submit-btn"]');
    
    // Verificar redirección a verificación de email
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.locator('[data-testid="verification-message"]'))
      .toContainText('Revisa tu email para verificar tu cuenta');
    
    // Simular verificación de email (en un entorno real, esto requeriría acceso al email)
    // Por ahora, navegamos directamente al login
    await page.goto('/login');
    
    // ===== PASO 2: LOGIN =====
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit-btn"]');
    
    // Verificar login exitoso
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // ===== PASO 3: NAVEGACIÓN Y BÚSQUEDA DE PRODUCTOS =====
    // Buscar un producto
    await page.fill('[data-testid="search-input"]', 'laptop');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verificar resultados de búsqueda
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
    
    // ===== PASO 4: AGREGAR PRODUCTOS AL CARRITO =====
    // Hacer click en el primer producto
    await page.click('[data-testid="product-card"]', { first: true });
    
    // Verificar página de producto
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
    
    // Seleccionar cantidad
    await page.selectOption('[data-testid="quantity-select"]', '2');
    
    // Agregar al carrito
    await page.click('[data-testid="add-to-cart-btn"]');
    
    // Verificar notificación de éxito
    await expect(page.locator('[data-testid="toast-success"]'))
      .toContainText('Producto agregado al carrito');
    
    // Verificar contador del carrito
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    
    // Agregar otro producto
    await page.goto('/products');
    await page.click('[data-testid="product-card"]', { nth: 1 });
    await page.click('[data-testid="add-to-cart-btn"]');
    
    // Verificar contador actualizado
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('3');
    
    // ===== PASO 5: REVISAR CARRITO =====
    await page.click('[data-testid="cart-icon"]');
    
    // Verificar página del carrito
    await expect(page).toHaveURL('/cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    
    // Verificar totales
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
    
    // Modificar cantidad de un producto
    await page.click('[data-testid="increase-quantity-btn"]', { first: true });
    
    // Verificar que el total se actualiza
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('4');
    
    // ===== PASO 6: PROCESO DE CHECKOUT =====
    await page.click('[data-testid="checkout-btn"]');
    
    // Verificar página de checkout
    await expect(page).toHaveURL('/checkout');
    await expect(page.locator('h1')).toContainText('Finalizar Compra');
    
    // Verificar resumen de productos
    await expect(page.locator('[data-testid="checkout-item"]')).toHaveCount(2);
    
    // ===== PASO 7: INFORMACIÓN DE ENVÍO =====
    await fillShippingForm(page);
    
    // Continuar al siguiente paso
    await page.click('[data-testid="continue-to-payment-btn"]');
    
    // ===== PASO 8: MÉTODO DE PAGO =====
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
    
    // Seleccionar MercadoPago
    await page.check('[data-testid="payment-mercadopago"]');
    
    // Verificar información de MercadoPago
    await expect(page.locator('[data-testid="mercadopago-info"]'))
      .toContainText('Paga con tarjeta de crédito, débito o efectivo');
    
    // ===== PASO 9: REVISIÓN FINAL =====
    await page.click('[data-testid="review-order-btn"]');
    
    // Verificar resumen final
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-summary"]')).toContainText(shippingAddress.street);
    await expect(page.locator('[data-testid="payment-summary"]')).toContainText('MercadoPago');
    
    // ===== PASO 10: FINALIZAR COMPRA =====
    await page.click('[data-testid="place-order-btn"]');
    
    // Verificar loading state
    await expect(page.locator('[data-testid="processing-order"]')).toBeVisible();
    
    // Esperar redirección a página de éxito
    await expect(page).toHaveURL(/\/orders\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    
    // Verificar página de confirmación
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    
    // Verificar que el carrito se limpió
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('0');
    
    // ===== PASO 11: VERIFICAR ORDEN EN PERFIL =====
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="my-orders-link"]');
    
    // Verificar que la orden aparece en el historial
    await expect(page.locator('[data-testid="order-item"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="order-status"]').first())
      .toContainText('Pendiente de Pago');
  });

  test('debe manejar errores durante el registro', async ({ page }) => {
    await page.goto('/register');
    
    // Intentar registrarse con email inválido
    await page.fill('[data-testid="register-email"]', 'email-invalido');
    await page.fill('[data-testid="register-password"]', testUser.password);
    await page.fill('[data-testid="register-confirm-password"]', testUser.password);
    await page.fill('[data-testid="register-full-name"]', testUser.fullName);
    
    await page.click('[data-testid="register-submit-btn"]');
    
    // Verificar mensaje de error
    await expect(page.locator('[data-testid="email-error"]'))
      .toContainText('Email inválido');
    
    // Intentar con contraseñas que no coinciden
    await page.fill('[data-testid="register-email"]', testUser.email);
    await page.fill('[data-testid="register-confirm-password"]', 'DiferentePassword123!');
    
    await page.click('[data-testid="register-submit-btn"]');
    
    await expect(page.locator('[data-testid="password-mismatch-error"]'))
      .toContainText('Las contraseñas no coinciden');
  });

  test('debe manejar carrito vacío en checkout', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'existing@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    // Intentar ir a checkout sin productos
    await page.goto('/checkout');
    
    // Debe redirigir al carrito
    await expect(page).toHaveURL('/cart');
    await expect(page.locator('[data-testid="empty-cart-message"]'))
      .toContainText('Tu carrito está vacío');
  });

  test('debe validar stock durante el checkout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'existing@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    // Agregar producto con cantidad alta
    await page.goto('/products');
    await page.click('[data-testid="product-card"]', { first: true });
    
    // Intentar agregar más cantidad que el stock disponible
    await page.selectOption('[data-testid="quantity-select"]', '999');
    await page.click('[data-testid="add-to-cart-btn"]');
    
    // Verificar mensaje de error de stock
    await expect(page.locator('[data-testid="stock-error"]'))
      .toContainText('Stock insuficiente');
  });

  test('debe mantener el carrito entre sesiones', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'existing@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    // Agregar producto al carrito
    await addProductToCart(page);
    
    // Verificar contador del carrito
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Recargar la página
    await page.reload();
    
    // Verificar que el carrito se mantiene
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Cerrar sesión
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-btn"]');
    
    // Login nuevamente
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'existing@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    // Verificar que el carrito se restaura
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('debe funcionar correctamente en dispositivos móviles', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'existing@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    // Verificar menú móvil
    await page.click('[data-testid="mobile-menu-btn"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Navegar a productos desde menú móvil
    await page.click('[data-testid="mobile-products-link"]');
    await expect(page).toHaveURL('/products');
    
    // Verificar que los productos se muestran correctamente en móvil
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    
    // Agregar producto al carrito
    await page.click('[data-testid="product-card"]', { first: true });
    await page.click('[data-testid="add-to-cart-btn"]');
    
    // Verificar carrito en móvil
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="mobile-cart"]')).toBeVisible();
    
    // Proceder al checkout en móvil
    await page.click('[data-testid="checkout-btn"]');
    
    // Verificar que el formulario de checkout es responsive
    await expect(page.locator('[data-testid="mobile-checkout-form"]')).toBeVisible();
    
    // Llenar formulario en móvil
    await fillShippingForm(page);
    
    // Verificar que los botones son accesibles en móvil
    await expect(page.locator('[data-testid="continue-to-payment-btn"]')).toBeVisible();
  });

  test('debe manejar interrupciones de red durante el checkout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'existing@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    // Agregar producto y ir a checkout
    await addProductToCart(page);
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-btn"]');
    
    // Llenar información de envío
    await fillShippingForm(page);
    await page.click('[data-testid="continue-to-payment-btn"]');
    
    // Seleccionar método de pago
    await page.check('[data-testid="payment-mercadopago"]');
    
    // Simular pérdida de conexión
    await page.context().setOffline(true);
    
    // Intentar finalizar compra
    await page.click('[data-testid="place-order-btn"]');
    
    // Verificar mensaje de error de conexión
    await expect(page.locator('[data-testid="network-error"]'))
      .toContainText('Error de conexión');
    
    // Restaurar conexión
    await page.context().setOffline(false);
    
    // Reintentar
    await page.click('[data-testid="retry-order-btn"]');
    
    // Verificar que la orden se procesa correctamente
    await expect(page).toHaveURL(/\/orders\/[a-zA-Z0-9-]+/, { timeout: 10000 });
  });
});

// Tests de rendimiento
test.describe('Rendimiento del Flujo de Compra', () => {
  test('debe cargar la página de productos en menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('debe procesar el checkout en menos de 5 segundos', async ({ page }) => {
    // Setup rápido
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'existing@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    await addProductToCart(page);
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-btn"]');
    
    await fillShippingForm(page);
    await page.click('[data-testid="continue-to-payment-btn"]');
    await page.check('[data-testid="payment-mercadopago"]');
    
    // Medir tiempo de procesamiento
    const startTime = Date.now();
    await page.click('[data-testid="place-order-btn"]');
    await page.waitForURL(/\/orders\/[a-zA-Z0-9-]+/);
    
    const processTime = Date.now() - startTime;
    expect(processTime).toBeLessThan(5000);
  });
});









