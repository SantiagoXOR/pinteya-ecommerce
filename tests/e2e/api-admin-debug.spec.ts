import { test, expect } from '@playwright/test'

// Headers exactos que funcionan con curl
const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-test-admin': 'true',
  'x-admin-email': 'santiago@xor.com.ar',
  'Authorization': 'Bearer test-admin-token',
}

test.describe('API Admin Debug - Categories', () => {
  test('Debug - API categorías con headers de test', async ({ request }) => {
    console.log('🔍 Iniciando debug de API categorías...')
    
    // Test directo con los mismos headers que funcionan en curl
    const response = await request.get('/api/admin/categories', {
      headers: ADMIN_HEADERS,
    })

    console.log(`📊 Status recibido: ${response.status()}`)
    
    // Intentar obtener el cuerpo de la respuesta
    let responseBody
    try {
      responseBody = await response.text()
      console.log(`📊 Cuerpo de respuesta (primeros 500 chars):`, responseBody.substring(0, 500))
    } catch (error) {
      console.log(`❌ Error obteniendo cuerpo de respuesta:`, error)
    }

    // Verificar que no sea un error de servidor
    expect(response.status()).toBeLessThan(500)
    
    // Si es 200, verificar estructura
    if (response.status() === 200) {
      try {
        const data = await response.json()
        console.log(`✅ JSON parseado exitosamente`)
        console.log(`✅ Propiedades del objeto:`, Object.keys(data))
        
        expect(data).toHaveProperty('categories')
        expect(Array.isArray(data.categories)).toBeTruthy()
        console.log(`✅ Categorías encontradas: ${data.categories?.length || 0}`)
      } catch (jsonError) {
        console.log(`❌ Error parseando JSON:`, jsonError)
        throw jsonError
      }
    } else {
      console.log(`⚠️ Status no es 200, es: ${response.status()}`)
      console.log(`⚠️ Respuesta:`, responseBody)
    }
  })

  test('Debug - Verificar servidor está corriendo', async ({ request }) => {
    console.log('🔍 Verificando que el servidor esté corriendo...')
    
    const response = await request.get('/')
    console.log(`📊 Status página principal: ${response.status()}`)
    
    expect(response.status()).toBe(200)
  })
})