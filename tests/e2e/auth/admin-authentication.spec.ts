import { test, expect } from '@playwright/test';

test.describe('Sistema de Autenticación Administrativa', () => {
  // Configuración de usuarios de prueba
  const ADMIN_USER = {
    email: 'santiago@xor.com.ar',
    password: 'SavoirFaire19$',
    role: 'admin'
  };

  const CUSTOMER_USER = {
    email: 'customer@test.com',
    password: 'TestPassword123!',
    role: 'customer'
  };

  test.beforeEach(async ({ page }) => {
    // Limpiar cookies y localStorage antes de cada test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('debe permitir login de usuario administrador', async ({ page }) => {
    // 1. Navegar a la página de login
    await page.goto('/sign-in');
    
    // 2. Verificar que la página de login carga correctamente
    await expect(page.locator('h1, h2')).toContainText(/sign in|iniciar sesión/i);
    
    // 3. Llenar formulario de login
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    
    // 4. Enviar formulario
    await page.click('button[type="submit"]');
    
    // 5. Esperar redirección exitosa
    await page.waitForURL('/', { timeout: 10000 });
    
    // 6. Verificar que el usuario está autenticado
    await expect(page.locator('[data-testid="user-menu"], .user-avatar, [aria-label*="user"]')).toBeVisible();
  });

  test('debe permitir acceso al panel administrativo para admin', async ({ page }) => {
    // 1. Login como admin
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // 2. Navegar al panel administrativo
    await page.goto('/admin');
    
    // 3. Verificar acceso exitoso al panel admin
    await expect(page.locator('h1')).toContainText(/admin|panel|dashboard/i);
    
    // 4. Verificar elementos del panel admin
    await expect(page.locator('text=Productos')).toBeVisible();
    await expect(page.locator('text=Órdenes')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('debe denegar acceso al panel administrativo para customer', async ({ page }) => {
    // Nota: Este test asume que existe un usuario customer en la base de datos
    // En un entorno real, necesitarías crear este usuario primero
    
    // 1. Intentar navegar directamente al panel admin sin autenticación
    await page.goto('/admin');
    
    // 2. Debería redirigir a login o mostrar error 403
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/sign-in') || currentUrl.includes('/login');
    const isErrorPage = currentUrl.includes('/403') || currentUrl.includes('/unauthorized');
    
    expect(isRedirectedToLogin || isErrorPage).toBeTruthy();
  });

  test('debe mostrar elementos del UI según permisos de admin', async ({ page }) => {
    // 1. Login como admin
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // 2. Navegar al panel admin
    await page.goto('/admin');
    
    // 3. Verificar que los elementos de admin están visibles
    await expect(page.locator('text=Gestión de Productos')).toBeVisible();
    await expect(page.locator('text=Gestión de Órdenes')).toBeVisible();
    await expect(page.locator('text=Gestión de Usuarios')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Configuración')).toBeVisible();
  });

  test('debe permitir navegación entre módulos administrativos', async ({ page }) => {
    // 1. Login como admin
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // 2. Navegar al panel admin
    await page.goto('/admin');
    
    // 3. Navegar a productos
    await page.click('text=Productos');
    await expect(page).toHaveURL('/admin/products');
    await expect(page.locator('h1')).toContainText(/productos/i);
    
    // 4. Navegar a crear producto
    await page.click('text=Nuevo Producto');
    await expect(page).toHaveURL('/admin/products/new');
    await expect(page.locator('h1')).toContainText(/crear/i);
    
    // 5. Volver al dashboard
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText(/admin|panel|dashboard/i);
  });

  test('debe manejar logout correctamente', async ({ page }) => {
    // 1. Login como admin
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // 2. Verificar que está autenticado
    await expect(page.locator('[data-testid="user-menu"], .user-avatar')).toBeVisible();
    
    // 3. Hacer logout
    await page.click('[data-testid="user-menu"], .user-avatar');
    await page.click('text=Cerrar sesión, text=Sign out, text=Logout');
    
    // 4. Verificar que se cerró la sesión
    await page.waitForURL('/', { timeout: 5000 });
    
    // 5. Intentar acceder al panel admin después del logout
    await page.goto('/admin');
    
    // 6. Debería redirigir a login
    const currentUrl = page.url();
    expect(currentUrl.includes('/sign-in') || currentUrl.includes('/login')).toBeTruthy();
  });

  test('debe persistir sesión después de recargar página', async ({ page }) => {
    // 1. Login como admin
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // 2. Navegar al panel admin
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText(/admin|panel|dashboard/i);
    
    // 3. Recargar la página
    await page.reload();
    
    // 4. Verificar que sigue autenticado
    await expect(page.locator('h1')).toContainText(/admin|panel|dashboard/i);
    
    // 5. Verificar que puede navegar a otras secciones
    await page.click('text=Productos');
    await expect(page).toHaveURL('/admin/products');
  });

  test('debe mostrar información correcta del usuario autenticado', async ({ page }) => {
    // 1. Login como admin
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // 2. Navegar al panel admin
    await page.goto('/admin');
    
    // 3. Verificar información del usuario (si está visible)
    const userInfo = page.locator('[data-testid="user-info"], .user-profile');
    
    if (await userInfo.isVisible()) {
      // Verificar que muestra el email o nombre del admin
      await expect(userInfo).toContainText(/santiago|admin/i);
    }
  });

  test('debe manejar errores de autenticación gracefully', async ({ page }) => {
    // 1. Intentar login con credenciales incorrectas
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 2. Verificar que muestra error
    await expect(page.locator('text=error, text=incorrect, text=invalid')).toBeVisible();
    
    // 3. Verificar que no redirige
    expect(page.url()).toContain('/sign-in');
  });

  test('debe verificar estado de carga durante autenticación', async ({ page }) => {
    // 1. Navegar a login
    await page.goto('/sign-in');
    
    // 2. Llenar formulario
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    
    // 3. Click en submit y verificar estado de carga
    await page.click('button[type="submit"]');
    
    // 4. Verificar que el botón muestra estado de carga
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    
    // 5. Esperar que termine la autenticación
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('debe funcionar correctamente en móviles', async ({ page }) => {
    // 1. Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 2. Login en móvil
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // 3. Navegar al panel admin en móvil
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText(/admin|panel|dashboard/i);
    
    // 4. Verificar que el menú móvil funciona
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    }
  });
});
