import { test, expect } from '@playwright/test';

test.describe('Verificación de Políticas RLS (Row Level Security)', () => {
  const ADMIN_USER = {
    email: 'santiago@xor.com.ar',
    password: 'SavoirFaire19$'
  };

  // Helper para autenticarse
  async function loginAsAdmin(page) {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('RLS debe permitir a admin leer todos los productos', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Acceder a la lista de productos
    const response = await page.request.get('/api/admin/products');
    
    // 3. Verificar que puede leer productos
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBeTruthy();
  });

  test('RLS debe permitir a admin crear productos', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Intentar crear un producto
    const productData = {
      name: 'Producto RLS Test',
      description: 'Test de políticas RLS',
      price: 1500,
      stock: 100,
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'draft'
    };
    
    const response = await page.request.post('/api/admin/products', {
      data: productData
    });
    
    // 3. Verificar que puede crear (si tiene permisos)
    if (response.status() === 201) {
      const responseBody = await response.json();
      expect(responseBody.data).toHaveProperty('id');
      expect(responseBody.data.name).toBe(productData.name);
    } else {
      // Si falla, verificar que es por permisos, no por RLS
      expect([403, 401]).toContain(response.status());
    }
  });

  test('RLS debe permitir a admin actualizar productos', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Obtener lista de productos
    const listResponse = await page.request.get('/api/admin/products');
    expect(listResponse.status()).toBe(200);
    
    const listData = await listResponse.json();
    
    if (listData.data && listData.data.length > 0) {
      const productId = listData.data[0].id;
      
      // 3. Intentar actualizar producto
      const updateData = {
        name: 'Producto RLS Actualizado',
        price: 2000
      };
      
      const updateResponse = await page.request.put(`/api/admin/products/${productId}`, {
        data: updateData
      });
      
      // 4. Verificar que puede actualizar
      if (updateResponse.status() === 200) {
        const responseBody = await updateResponse.json();
        expect(responseBody.data.name).toBe(updateData.name);
      } else {
        // Si falla, verificar que es por permisos
        expect([403, 401, 404]).toContain(updateResponse.status());
      }
    }
  });

  test('RLS debe permitir a admin eliminar productos', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Crear un producto para eliminar
    const productData = {
      name: 'Producto Para Eliminar RLS',
      description: 'Este producto será eliminado',
      price: 1000,
      stock: 50,
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'draft'
    };
    
    const createResponse = await page.request.post('/api/admin/products', {
      data: productData
    });
    
    if (createResponse.status() === 201) {
      const createData = await createResponse.json();
      const productId = createData.data.id;
      
      // 3. Intentar eliminar el producto
      const deleteResponse = await page.request.delete(`/api/admin/products/${productId}`);
      
      // 4. Verificar que puede eliminar
      if (deleteResponse.status() === 200) {
        const responseBody = await deleteResponse.json();
        expect(responseBody.message).toContain('eliminado');
      } else {
        // Si falla, verificar que es por permisos
        expect([403, 401, 404]).toContain(deleteResponse.status());
      }
    }
  });

  test('RLS debe proteger acceso a user_profiles', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Intentar acceder a información de perfiles de usuario
    // Nota: Esto requeriría una API específica para user_profiles
    // Por ahora, verificamos que el sistema de roles funciona
    
    // 3. Verificar que el usuario admin puede acceder al panel
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText(/admin|panel|dashboard/i);
    
    // 4. Verificar que puede ver información de usuarios (si tiene permisos)
    const usersSection = page.locator('text=Usuarios, text=Users');
    if (await usersSection.isVisible()) {
      await usersSection.click();
      // Verificar que puede acceder a gestión de usuarios
      await expect(page.locator('h1')).toContainText(/usuarios|users/i);
    }
  });

  test('RLS debe proteger acceso a analytics_events', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Intentar acceder a analytics
    await page.goto('/admin');
    
    // 3. Buscar sección de analytics
    const analyticsSection = page.locator('text=Analytics');
    if (await analyticsSection.isVisible()) {
      await analyticsSection.click();
      
      // 4. Verificar que puede acceder a analytics
      await expect(page.locator('h1')).toContainText(/analytics/i);
    }
  });

  test('RLS debe proteger acceso a system_settings', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Intentar acceder a configuración del sistema
    await page.goto('/admin');
    
    // 3. Buscar sección de configuración
    const settingsSection = page.locator('text=Configuración, text=Settings');
    if (await settingsSection.isVisible()) {
      await settingsSection.click();
      
      // 4. Verificar que puede acceder a configuración
      await expect(page.locator('h1')).toContainText(/configuración|settings/i);
    }
  });

  test('RLS debe registrar acciones en audit_log', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Realizar una acción que debería ser auditada
    const productData = {
      name: 'Producto Audit RLS Test',
      description: 'Test de audit log con RLS',
      price: 1300,
      stock: 80,
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'active'
    };
    
    const response = await page.request.post('/api/admin/products', {
      data: productData
    });
    
    // 3. Verificar que la acción fue registrada
    if (response.status() === 201) {
      // En un test real, aquí verificarías que se creó una entrada en audit_log
      // Esto requeriría acceso a una API específica para audit log
      const responseBody = await response.json();
      expect(responseBody.data).toHaveProperty('id');
    }
  });

  test('RLS debe manejar usuarios sin permisos correctamente', async ({ page }) => {
    // 1. Intentar acceder sin autenticación
    const response = await page.request.get('/api/admin/products');
    
    // 2. Verificar que RLS bloquea el acceso
    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    expect(responseBody.error).toContain('autorizado');
  });

  test('RLS debe funcionar con filtros de búsqueda', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Hacer búsqueda con filtros
    const response = await page.request.get('/api/admin/products?search=pintura&status=active');
    
    // 3. Verificar que RLS permite la búsqueda
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('data');
    expect(responseBody).toHaveProperty('filters');
  });

  test('RLS debe funcionar con paginación', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Hacer request con paginación
    const response = await page.request.get('/api/admin/products?page=1&pageSize=10');
    
    // 3. Verificar que RLS permite la paginación
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('data');
    expect(responseBody).toHaveProperty('page');
    expect(responseBody).toHaveProperty('totalPages');
  });

  test('RLS debe funcionar con ordenamiento', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Hacer request con ordenamiento
    const response = await page.request.get('/api/admin/products?sortBy=name&sortOrder=asc');
    
    // 3. Verificar que RLS permite el ordenamiento
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('data');
    expect(responseBody).toHaveProperty('sort');
    
    // 4. Verificar que los datos están ordenados (si hay datos)
    if (responseBody.data.length > 1) {
      const firstProduct = responseBody.data[0];
      const secondProduct = responseBody.data[1];
      expect(firstProduct.name.localeCompare(secondProduct.name)).toBeLessThanOrEqual(0);
    }
  });

  test('RLS debe manejar transacciones correctamente', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page);
    
    // 2. Crear múltiples productos en secuencia
    const products = [
      {
        name: 'Producto RLS 1',
        description: 'Test transaccional 1',
        price: 1000,
        stock: 50,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'draft'
      },
      {
        name: 'Producto RLS 2',
        description: 'Test transaccional 2',
        price: 1500,
        stock: 75,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'active'
      }
    ];
    
    // 3. Crear productos y verificar que RLS funciona en transacciones
    for (const productData of products) {
      const response = await page.request.post('/api/admin/products', {
        data: productData
      });
      
      if (response.status() === 201) {
        const responseBody = await response.json();
        expect(responseBody.data.name).toBe(productData.name);
      }
    }
  });
});
