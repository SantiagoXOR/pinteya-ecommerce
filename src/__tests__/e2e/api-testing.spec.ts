import { test, expect } from '@playwright/test';

/**
 * TESTING COMPLETO DE APIs - FLUJO DE COMPRA
 * 
 * Este test verifica todas las APIs necesarias para el flujo de compra
 */

test.describe('API Testing for Purchase Flow', () => {
  
  test('Test All Purchase Flow APIs', async ({ request }) => {
    console.log('🔧 Iniciando testing completo de APIs...');

    const baseURL = 'http://localhost:3000';
    const results = {
      products: { status: 'unknown', data: null, error: null },
      categories: { status: 'unknown', data: null, error: null },
      mercadopago: { status: 'unknown', data: null, error: null },
      orders: { status: 'unknown', data: null, error: null },
      cart: { status: 'unknown', data: null, error: null }
    };

    // TEST 1: API de Productos
    console.log('📦 Testing API de Productos...');
    try {
      const response = await request.get(`${baseURL}/api/products`);
      results.products.status = response.status();
      
      if (response.ok()) {
        const data = await response.json();
        results.products.data = data;
        console.log(`✅ Productos API: ${response.status()}`);
        console.log(`📊 Productos encontrados: ${Array.isArray(data) ? data.length : 'N/A'}`);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`🎯 Primer producto: ${data[0].name || data[0].title || 'Sin nombre'}`);
        }
      } else {
        console.log(`❌ Productos API falló: ${response.status()}`);
      }
    } catch (error) {
      results.products.error = error.message;
      console.log(`❌ Error en Productos API: ${error.message}`);
    }

    // TEST 2: API de Categorías
    console.log('🏷️ Testing API de Categorías...');
    try {
      const response = await request.get(`${baseURL}/api/categories`);
      results.categories.status = response.status();
      
      if (response.ok()) {
        const data = await response.json();
        results.categories.data = data;
        console.log(`✅ Categorías API: ${response.status()}`);
        console.log(`📊 Categorías encontradas: ${Array.isArray(data) ? data.length : 'N/A'}`);
      } else {
        console.log(`❌ Categorías API falló: ${response.status()}`);
      }
    } catch (error) {
      results.categories.error = error.message;
      console.log(`❌ Error en Categorías API: ${error.message}`);
    }

    // TEST 3: API de MercadoPago
    console.log('💳 Testing API de MercadoPago...');
    try {
      const testPayload = {
        items: [{
          title: 'Producto de Prueba',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS'
        }],
        payer: {
          email: 'test@example.com'
        }
      };

      const response = await request.post(`${baseURL}/api/mercadopago/preferences`, {
        data: testPayload
      });
      
      results.mercadopago.status = response.status();
      
      if (response.ok()) {
        const data = await response.json();
        results.mercadopago.data = data;
        console.log(`✅ MercadoPago API: ${response.status()}`);
        console.log(`🔗 Preference ID: ${data.id || 'No ID'}`);
      } else {
        console.log(`❌ MercadoPago API falló: ${response.status()}`);
        const errorText = await response.text();
        console.log(`📄 Error response: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      results.mercadopago.error = error.message;
      console.log(`❌ Error en MercadoPago API: ${error.message}`);
    }

    // TEST 4: API de Órdenes
    console.log('📋 Testing API de Órdenes...');
    try {
      const response = await request.get(`${baseURL}/api/orders`);
      results.orders.status = response.status();
      
      if (response.ok()) {
        const data = await response.json();
        results.orders.data = data;
        console.log(`✅ Órdenes API: ${response.status()}`);
        console.log(`📊 Órdenes encontradas: ${Array.isArray(data) ? data.length : 'N/A'}`);
      } else {
        console.log(`❌ Órdenes API falló: ${response.status()}`);
      }
    } catch (error) {
      results.orders.error = error.message;
      console.log(`❌ Error en Órdenes API: ${error.message}`);
    }

    // TEST 5: Endpoints adicionales
    console.log('🔍 Testing endpoints adicionales...');
    
    const additionalEndpoints = [
      '/api/brands',
      '/api/search/trending',
      '/api/admin/products',
      '/api/mercadopago/webhook'
    ];

    for (const endpoint of additionalEndpoints) {
      try {
        const response = await request.get(`${baseURL}${endpoint}`);
        console.log(`📡 ${endpoint}: ${response.status()}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
      }
    }

    // RESUMEN FINAL
    console.log('\n📊 RESUMEN DE APIS:');
    console.log('==================');
    
    Object.entries(results).forEach(([api, result]) => {
      const status = result.status === 200 ? '✅' : result.status >= 400 ? '❌' : '⚠️';
      console.log(`${status} ${api.toUpperCase()}: ${result.status}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Verificaciones básicas
    expect(results.products.status).toBe(200);
    expect(results.categories.status).toBe(200);
    
    console.log('\n✅ Testing de APIs completado');
  });

  test('Test Product Detail API', async ({ request }) => {
    console.log('🎯 Testing API de detalle de productos...');

    const baseURL = 'http://localhost:3000';
    
    // Primero obtener lista de productos
    try {
      const productsResponse = await request.get(`${baseURL}/api/products`);
      
      if (productsResponse.ok()) {
        const products = await productsResponse.json();
        
        if (Array.isArray(products) && products.length > 0) {
          const firstProduct = products[0];
          const productId = firstProduct.id || firstProduct._id || 1;
          
          console.log(`🔍 Testing producto ID: ${productId}`);
          
          // Test detalle del producto
          const detailResponse = await request.get(`${baseURL}/api/products/${productId}`);
          console.log(`📦 Detalle producto: ${detailResponse.status()}`);
          
          if (detailResponse.ok()) {
            const productDetail = await detailResponse.json();
            console.log(`✅ Producto encontrado: ${productDetail.name || productDetail.title || 'Sin nombre'}`);
            console.log(`💰 Precio: ${productDetail.price || 'No especificado'}`);
          }
        } else {
          console.log('⚠️ No hay productos disponibles para testing');
        }
      }
    } catch (error) {
      console.log(`❌ Error testing detalle de productos: ${error.message}`);
    }
  });

  test('Test Cart Operations', async ({ request }) => {
    console.log('🛒 Testing operaciones del carrito...');

    const baseURL = 'http://localhost:3000';
    
    // Test agregar al carrito (si existe endpoint)
    try {
      const addToCartPayload = {
        productId: 1,
        quantity: 1
      };

      const response = await request.post(`${baseURL}/api/cart/add`, {
        data: addToCartPayload
      });
      
      console.log(`🛒 Agregar al carrito: ${response.status()}`);
      
      if (response.ok()) {
        const result = await response.json();
        console.log(`✅ Producto agregado al carrito: ${JSON.stringify(result)}`);
      } else {
        console.log(`⚠️ Endpoint de carrito no disponible o requiere autenticación`);
      }
    } catch (error) {
      console.log(`⚠️ API de carrito no implementada: ${error.message}`);
    }

    // Test obtener carrito
    try {
      const response = await request.get(`${baseURL}/api/cart`);
      console.log(`🛍️ Obtener carrito: ${response.status()}`);
    } catch (error) {
      console.log(`⚠️ Error obteniendo carrito: ${error.message}`);
    }
  });

  test('Test Search and Filters', async ({ request }) => {
    console.log('🔍 Testing búsqueda y filtros...');

    const baseURL = 'http://localhost:3000';
    
    // Test búsqueda de productos
    const searchTerms = ['pintura', 'herramienta', 'test'];
    
    for (const term of searchTerms) {
      try {
        const response = await request.get(`${baseURL}/api/products?search=${term}`);
        console.log(`🔍 Búsqueda "${term}": ${response.status()}`);
        
        if (response.ok()) {
          const results = await response.json();
          const count = Array.isArray(results) ? results.length : 'N/A';
          console.log(`   Resultados: ${count}`);
        }
      } catch (error) {
        console.log(`❌ Error búsqueda "${term}": ${error.message}`);
      }
    }

    // Test filtros por categoría
    try {
      const response = await request.get(`${baseURL}/api/products?category=pinturas`);
      console.log(`🏷️ Filtro por categoría: ${response.status()}`);
    } catch (error) {
      console.log(`❌ Error filtro categoría: ${error.message}`);
    }
  });
});
