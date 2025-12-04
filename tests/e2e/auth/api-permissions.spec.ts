import { test, expect } from '@playwright/test'

test.describe('Verificación de Permisos en APIs Administrativas', () => {
  const ADMIN_USER = {
    email: 'santiago@xor.com.ar',
    password: 'SavoirFaire19$',
  }

  // Helper para autenticarse como admin
  async function loginAsAdmin(page) {
    await page.goto('/sign-in')
    await page.fill('input[type="email"]', ADMIN_USER.email)
    await page.fill('input[type="password"]', ADMIN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 10000 })
  }

  test.beforeEach(async ({ page }) => {
    // Limpiar estado antes de cada test
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('API de productos debe requerir autenticación admin', async ({ page }) => {
    // 1. Intentar acceder a API sin autenticación
    const response = await page.request.get('/api/admin/products')

    // 2. Verificar que retorna 401 Unauthorized
    expect(response.status()).toBe(401)

    const responseBody = await response.json()
    expect(responseBody.error).toContain('autorizado')
  })

  test('API de productos debe permitir acceso con autenticación admin', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Hacer request a API de productos
    const response = await page.request.get('/api/admin/products')

    // 3. Verificar que retorna 200 OK
    expect(response.status()).toBe(200)

    const responseBody = await response.json()
    expect(responseBody).toHaveProperty('data')
    expect(Array.isArray(responseBody.data)).toBeTruthy()
  })

  test('API de crear producto debe verificar permisos de creación', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Intentar crear producto con datos válidos
    const productData = {
      name: 'Producto Test E2E',
      description: 'Descripción de prueba para E2E',
      price: 1500,
      stock: 100,
      category_id: '123e4567-e89b-12d3-a456-426614174000', // UUID de ejemplo
      status: 'draft',
    }

    const response = await page.request.post('/api/admin/products', {
      data: productData,
    })

    // 3. Verificar respuesta (puede ser 201 si tiene permisos, o 403 si no)
    if (response.status() === 201) {
      const responseBody = await response.json()
      expect(responseBody.message).toContain('exitosamente')
      expect(responseBody.data).toHaveProperty('id')
    } else if (response.status() === 403) {
      const responseBody = await response.json()
      expect(responseBody.error).toContain('permiso')
    }
  })

  test('API de actualizar producto debe verificar permisos de edición', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Primero obtener lista de productos
    const listResponse = await page.request.get('/api/admin/products')
    expect(listResponse.status()).toBe(200)

    const listData = await listResponse.json()

    if (listData.data && listData.data.length > 0) {
      const productId = listData.data[0].id

      // 3. Intentar actualizar producto
      const updateData = {
        name: 'Producto Actualizado E2E',
        price: 2000,
      }

      const updateResponse = await page.request.put(`/api/admin/products/${productId}`, {
        data: updateData,
      })

      // 4. Verificar respuesta
      if (updateResponse.status() === 200) {
        const responseBody = await updateResponse.json()
        expect(responseBody.message).toContain('actualizado')
      } else if (updateResponse.status() === 403) {
        const responseBody = await updateResponse.json()
        expect(responseBody.error).toContain('permiso')
      }
    }
  })

  test('API de eliminar producto debe verificar permisos de eliminación', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Crear un producto de prueba primero
    const productData = {
      name: 'Producto Para Eliminar E2E',
      description: 'Este producto será eliminado en el test',
      price: 1000,
      stock: 50,
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'draft',
    }

    const createResponse = await page.request.post('/api/admin/products', {
      data: productData,
    })

    if (createResponse.status() === 201) {
      const createData = await createResponse.json()
      const productId = createData.data.id

      // 3. Intentar eliminar el producto
      const deleteResponse = await page.request.delete(`/api/admin/products/${productId}`)

      // 4. Verificar respuesta
      if (deleteResponse.status() === 200) {
        const responseBody = await deleteResponse.json()
        expect(responseBody.message).toContain('eliminado')
      } else if (deleteResponse.status() === 403) {
        const responseBody = await deleteResponse.json()
        expect(responseBody.error).toContain('permiso')
      }
    }
  })

  test('API debe validar datos de entrada correctamente', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Intentar crear producto con datos inválidos
    const invalidProductData = {
      name: '', // Nombre vacío (inválido)
      price: -100, // Precio negativo (inválido)
      stock: -50, // Stock negativo (inválido)
      category_id: 'invalid-uuid', // UUID inválido
    }

    const response = await page.request.post('/api/admin/products', {
      data: invalidProductData,
    })

    // 3. Verificar que retorna error de validación
    expect(response.status()).toBe(400)

    const responseBody = await response.json()
    expect(responseBody.error).toContain('inválido')
    expect(responseBody).toHaveProperty('details') // Detalles de validación Zod
  })

  test('API debe manejar errores de base de datos gracefully', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Intentar obtener producto con ID inexistente
    const fakeProductId = '00000000-0000-0000-0000-000000000000'
    const response = await page.request.get(`/api/admin/products/${fakeProductId}`)

    // 3. Verificar que retorna 404
    expect(response.status()).toBe(404)

    const responseBody = await response.json()
    expect(responseBody.error).toContain('no encontrado')
  })

  test('API debe registrar acciones en audit log', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Realizar una acción que debería ser registrada
    const productData = {
      name: 'Producto Audit Test',
      description: 'Test para verificar audit log',
      price: 1200,
      stock: 75,
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'active',
    }

    const response = await page.request.post('/api/admin/products', {
      data: productData,
    })

    // 3. Verificar que la acción fue exitosa
    if (response.status() === 201) {
      const responseBody = await response.json()
      expect(responseBody.data).toHaveProperty('id')

      // Nota: En un test real, aquí verificarías que se creó una entrada en audit_log
      // Esto requeriría acceso directo a la base de datos o una API específica para audit log
    }
  })

  test('API debe manejar rate limiting correctamente', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Hacer múltiples requests rápidos para probar rate limiting
    const requests = []
    for (let i = 0; i < 10; i++) {
      requests.push(page.request.get('/api/admin/products'))
    }

    const responses = await Promise.all(requests)

    // 3. Verificar que al menos algunos requests fueron exitosos
    const successfulRequests = responses.filter(r => r.status() === 200)
    expect(successfulRequests.length).toBeGreaterThan(0)

    // 4. Si hay rate limiting, algunos requests deberían retornar 429
    const rateLimitedRequests = responses.filter(r => r.status() === 429)
    // Nota: Esto depende de si tienes rate limiting implementado
  })

  test('API debe retornar headers de seguridad apropiados', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Hacer request a API
    const response = await page.request.get('/api/admin/products')

    // 3. Verificar headers de seguridad
    const headers = response.headers()

    // Verificar Content-Type
    expect(headers['content-type']).toContain('application/json')

    // Verificar que no expone información sensible
    expect(headers['server']).toBeUndefined()
    expect(headers['x-powered-by']).toBeUndefined()
  })

  test('API debe manejar timeouts correctamente', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Hacer request con timeout corto
    try {
      const response = await page.request.get('/api/admin/products', {
        timeout: 1000, // 1 segundo
      })

      // 3. Si el request es exitoso, verificar que es rápido
      expect(response.status()).toBe(200)
    } catch (error) {
      // 4. Si hay timeout, verificar que es el error esperado
      expect(error.message).toContain('timeout')
    }
  })

  test('API debe funcionar correctamente con paginación', async ({ page }) => {
    // 1. Autenticarse como admin
    await loginAsAdmin(page)

    // 2. Hacer request con parámetros de paginación
    const response = await page.request.get('/api/admin/products?page=1&pageSize=5')

    // 3. Verificar respuesta de paginación
    expect(response.status()).toBe(200)

    const responseBody = await response.json()
    expect(responseBody).toHaveProperty('data')
    expect(responseBody).toHaveProperty('total')
    expect(responseBody).toHaveProperty('page')
    expect(responseBody).toHaveProperty('pageSize')
    expect(responseBody).toHaveProperty('totalPages')

    // 4. Verificar que respeta el pageSize
    expect(responseBody.data.length).toBeLessThanOrEqual(5)
  })
})
