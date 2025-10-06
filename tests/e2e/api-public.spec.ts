/**
 * TESTS API-FIRST PARA FUNCIONALIDAD PÚBLICA
 *
 * Tests de APIs públicas que no requieren autenticación
 */

import { test, expect } from '@playwright/test'

test.describe('APIs Públicas - Enfoque API-First', () => {
  test('API /api/products - Listar productos públicos', async ({ request }) => {
    console.log('🧪 Testeando API pública de productos...')

    const response = await request.get('/api/products')

    console.log(`📊 Status: ${response.status()}`)

    // Verificar respuesta exitosa
    expect(response.status()).toBe(200)

    const data = await response.json()
    console.log(`✅ Productos públicos: ${data.products?.length || 0}`)

    // Verificar estructura
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()

    if (data.products.length > 0) {
      const product = data.products[0]
      expect(product).toHaveProperty('id')
      expect(product).toHaveProperty('name')
      expect(product).toHaveProperty('price')
      expect(product).toHaveProperty('category')
    }
  })

  test('API /api/categories - Listar categorías públicas', async ({ request }) => {
    console.log('🧪 Testeando API pública de categorías...')

    const response = await request.get('/api/categories')

    console.log(`📊 Status: ${response.status()}`)

    expect(response.status()).toBe(200)

    const data = await response.json()
    console.log(`✅ Categorías públicas: ${data.categories?.length || 0}`)

    expect(data).toHaveProperty('categories')
    expect(Array.isArray(data.categories)).toBeTruthy()

    if (data.categories.length > 0) {
      const category = data.categories[0]
      expect(category).toHaveProperty('id')
      expect(category).toHaveProperty('name')
    }
  })

  test('API /api/search - Búsqueda de productos', async ({ request }) => {
    console.log('🧪 Testeando API de búsqueda...')

    const searchQuery = 'pintura'
    const response = await request.get(`/api/search?q=${searchQuery}`)

    console.log(`📊 Status: ${response.status()}`)

    expect(response.status()).toBe(200)

    const data = await response.json()
    console.log(`✅ Resultados de búsqueda: ${data.results?.length || 0}`)

    expect(data).toHaveProperty('results')
    expect(Array.isArray(data.results)).toBeTruthy()
    expect(data).toHaveProperty('query')
    expect(data.query).toBe(searchQuery)
  })

  test('API /api/products/[id] - Detalle de producto', async ({ request }) => {
    console.log('🧪 Testeando API de detalle de producto...')

    // Primero obtener lista de productos
    const listResponse = await request.get('/api/products')
    expect(listResponse.status()).toBe(200)

    const listData = await listResponse.json()

    if (listData.products && listData.products.length > 0) {
      const productId = listData.products[0].id

      // Obtener detalle del primer producto
      const detailResponse = await request.get(`/api/products/${productId}`)

      console.log(`📊 Status: ${detailResponse.status()}`)

      expect(detailResponse.status()).toBe(200)

      const detailData = await detailResponse.json()
      console.log(`✅ Detalle obtenido para producto: ${detailData.product?.name}`)

      expect(detailData).toHaveProperty('product')
      expect(detailData.product.id).toBe(productId)
      expect(detailData.product).toHaveProperty('name')
      expect(detailData.product).toHaveProperty('description')
      expect(detailData.product).toHaveProperty('price')
    } else {
      console.log('⚠️ No hay productos para testear detalle')
    }
  })

  test('API /api/cart - Gestión de carrito', async ({ request }) => {
    console.log('🧪 Testeando API de carrito...')

    // Obtener carrito vacío
    const getResponse = await request.get('/api/cart')

    console.log(`📊 Status: ${getResponse.status()}`)

    expect(getResponse.status()).toBe(200)

    const cartData = await getResponse.json()
    console.log(`✅ Carrito obtenido: ${cartData.items?.length || 0} items`)

    expect(cartData).toHaveProperty('items')
    expect(Array.isArray(cartData.items)).toBeTruthy()
    expect(cartData).toHaveProperty('total')
    expect(typeof cartData.total).toBe('number')
  })

  test('API /api/trending - Productos trending', async ({ request }) => {
    console.log('🧪 Testeando API de productos trending...')

    const response = await request.get('/api/trending')

    console.log(`📊 Status: ${response.status()}`)

    expect(response.status()).toBe(200)

    const data = await response.json()
    console.log(`✅ Productos trending: ${data.trending?.length || 0}`)

    expect(data).toHaveProperty('trending')
    expect(Array.isArray(data.trending)).toBeTruthy()
  })

  test('Flujo completo: Buscar → Seleccionar → Agregar al carrito', async ({ request }) => {
    console.log('🧪 Testeando flujo completo de compra...')

    // 1. Buscar productos
    const searchResponse = await request.get('/api/search?q=pintura')
    expect(searchResponse.status()).toBe(200)

    const searchData = await searchResponse.json()

    if (searchData.results && searchData.results.length > 0) {
      const product = searchData.results[0]
      console.log(`✅ Producto encontrado: ${product.name}`)

      // 2. Obtener detalle del producto
      const detailResponse = await request.get(`/api/products/${product.id}`)
      expect(detailResponse.status()).toBe(200)

      const detailData = await detailResponse.json()
      console.log(`✅ Detalle obtenido: ${detailData.product.name}`)

      // 3. Agregar al carrito
      const addToCartResponse = await request.post('/api/cart', {
        data: {
          productId: product.id,
          quantity: 1,
        },
      })

      console.log(`📊 Add to cart Status: ${addToCartResponse.status()}`)

      if (addToCartResponse.status() === 200 || addToCartResponse.status() === 201) {
        const cartData = await addToCartResponse.json()
        console.log(`✅ Producto agregado al carrito`)

        expect(cartData).toHaveProperty('items')
        expect(cartData.items.length).toBeGreaterThan(0)
      } else {
        console.log(`⚠️ Carrito no disponible: ${addToCartResponse.status()}`)
      }
    } else {
      console.log('⚠️ No hay productos para testear flujo completo')
    }
  })

  test('Verificar performance de APIs públicas', async ({ request }) => {
    console.log('🧪 Testeando performance de APIs...')

    const apis = ['/api/products', '/api/categories', '/api/trending']

    for (const api of apis) {
      const startTime = Date.now()
      const response = await request.get(api)
      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`📊 ${api}: ${response.status()} - ${duration}ms`)

      expect(response.status()).toBe(200)
      expect(duration).toBeLessThan(5000) // Máximo 5 segundos

      if (duration > 1000) {
        console.log(`⚠️ API lenta: ${api} tomó ${duration}ms`)
      }
    }
  })

  test('Verificar headers de respuesta', async ({ request }) => {
    console.log('🧪 Testeando headers de respuesta...')

    const response = await request.get('/api/products')

    expect(response.status()).toBe(200)

    const headers = response.headers()
    console.log(`✅ Headers verificados`)

    // Verificar headers importantes
    expect(headers['content-type']).toContain('application/json')

    // Verificar headers de seguridad si están presentes
    if (headers['x-frame-options']) {
      console.log(`🔒 X-Frame-Options: ${headers['x-frame-options']}`)
    }

    if (headers['x-content-type-options']) {
      console.log(`🔒 X-Content-Type-Options: ${headers['x-content-type-options']}`)
    }
  })
})
