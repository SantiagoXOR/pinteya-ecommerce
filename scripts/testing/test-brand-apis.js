// ===================================
// SCRIPT DE PRUEBA: APIs de Marcas y Productos Actualizadas
// Fecha: 2025-06-29
// Descripción: Probar las nuevas funcionalidades de marcas en las APIs
// ===================================

const BASE_URL = 'http://localhost:3001/api'

// ===================================
// FUNCIONES DE PRUEBA
// ===================================

/**
 * Prueba la API de marcas
 */
async function testBrandsAPI() {
  console.log('🧪 Probando API de marcas...\n')

  try {
    // 1. Obtener todas las marcas
    console.log('1. Obteniendo todas las marcas:')
    const brandsResponse = await fetch(`${BASE_URL}/brands`)
    const brandsData = await brandsResponse.json()

    if (brandsData.success) {
      console.log(`✅ ${brandsData.data.length} marcas encontradas:`)
      brandsData.data.forEach(brand => {
        console.log(`   - ${brand.name}: ${brand.products_count} productos`)
      })
    } else {
      console.log('❌ Error obteniendo marcas:', brandsData.error)
    }

    console.log('')

    // 2. Buscar marcas por término
    console.log('2. Buscando marcas con "galgo":')
    const searchResponse = await fetch(`${BASE_URL}/brands?search=galgo`)
    const searchData = await searchResponse.json()

    if (searchData.success) {
      console.log(`✅ ${searchData.data.length} marcas encontradas:`)
      searchData.data.forEach(brand => {
        console.log(`   - ${brand.name}: ${brand.products_count} productos`)
      })
    } else {
      console.log('❌ Error buscando marcas:', searchData.error)
    }

    console.log('')

    // 3. Obtener estadísticas de marcas
    console.log('3. Obteniendo estadísticas de marcas:')
    const statsResponse = await fetch(`${BASE_URL}/brands`, { method: 'POST' })
    const statsData = await statsResponse.json()

    if (statsData.success) {
      console.log(`✅ Estadísticas de ${statsData.data.length} marcas:`)
      statsData.data.slice(0, 3).forEach(stats => {
        console.log(`   - ${stats.name}:`)
        console.log(`     * Productos: ${stats.products_count}`)
        console.log(`     * Stock total: ${stats.total_stock}`)
        console.log(`     * Precio promedio: $${stats.avg_price}`)
        console.log(`     * Rango: $${stats.min_price} - $${stats.max_price}`)
      })
    } else {
      console.log('❌ Error obteniendo estadísticas:', statsData.error)
    }
  } catch (error) {
    console.error('❌ Error en prueba de API de marcas:', error.message)
  }
}

/**
 * Prueba la API de productos con filtros de marca
 */
async function testProductsWithBrandAPI() {
  console.log('\n🧪 Probando API de productos con filtros de marca...\n')

  try {
    // 1. Filtrar productos por marca
    console.log('1. Obteniendo productos de marca "El Galgo":')
    const galgoResponse = await fetch(`${BASE_URL}/products?brand=El Galgo&limit=5`)
    const galgoData = await galgoResponse.json()

    if (galgoData.success) {
      console.log(`✅ ${galgoData.data.length} productos encontrados:`)
      galgoData.data.forEach(product => {
        console.log(`   - ${product.name} (${product.brand}) - $${product.price}`)
      })
    } else {
      console.log('❌ Error obteniendo productos El Galgo:', galgoData.error)
    }

    console.log('')

    // 2. Buscar productos incluyendo marca
    console.log('2. Buscando productos con "poximix":')
    const searchResponse = await fetch(`${BASE_URL}/products?search=poximix&limit=5`)
    const searchData = await searchResponse.json()

    if (searchData.success) {
      console.log(`✅ ${searchData.data.length} productos encontrados:`)
      searchData.data.forEach(product => {
        console.log(`   - ${product.name} (${product.brand}) - $${product.price}`)
      })
    } else {
      console.log('❌ Error buscando productos:', searchData.error)
    }

    console.log('')

    // 3. Ordenar productos por marca
    console.log('3. Obteniendo productos ordenados por marca:')
    const sortedResponse = await fetch(`${BASE_URL}/products?sortBy=brand&sortOrder=asc&limit=10`)
    const sortedData = await sortedResponse.json()

    if (sortedData.success) {
      console.log(`✅ ${sortedData.data.length} productos ordenados por marca:`)
      sortedData.data.forEach(product => {
        console.log(`   - ${product.brand || 'Sin marca'}: ${product.name}`)
      })
    } else {
      console.log('❌ Error obteniendo productos ordenados:', sortedData.error)
    }

    console.log('')

    // 4. Combinar filtros: marca + categoría
    console.log('4. Productos de marca "Plavicon" en categoría específica:')
    const combinedResponse = await fetch(`${BASE_URL}/products?brand=Plavicon&limit=5`)
    const combinedData = await combinedResponse.json()

    if (combinedData.success) {
      console.log(`✅ ${combinedData.data.length} productos encontrados:`)
      combinedData.data.forEach(product => {
        console.log(`   - ${product.name} (${product.brand}) - $${product.price}`)
      })
    } else {
      console.log('❌ Error con filtros combinados:', combinedData.error)
    }
  } catch (error) {
    console.error('❌ Error en prueba de API de productos:', error.message)
  }
}

/**
 * Prueba un producto específico para verificar el campo brand
 */
async function testSingleProduct() {
  console.log('\n🧪 Probando producto individual...\n')

  try {
    // Obtener un producto específico
    console.log('Obteniendo producto ID 41 (Pincel El Galgo):')
    const productResponse = await fetch(`${BASE_URL}/products/41`)
    const productData = await productResponse.json()

    if (productData.success) {
      const product = productData.data
      console.log('✅ Producto obtenido:')
      console.log(`   - ID: ${product.id}`)
      console.log(`   - Nombre: ${product.name}`)
      console.log(`   - Marca: ${product.brand || 'Sin marca'}`)
      console.log(`   - Precio: $${product.price}`)
      console.log(`   - Stock: ${product.stock}`)
      console.log(`   - Categoría: ${product.category?.name || 'Sin categoría'}`)
    } else {
      console.log('❌ Error obteniendo producto:', productData.error)
    }
  } catch (error) {
    console.error('❌ Error en prueba de producto individual:', error.message)
  }
}

// ===================================
// FUNCIÓN PRINCIPAL
// ===================================

async function runTests() {
  console.log('🚀 Iniciando pruebas de APIs actualizadas...\n')
  console.log('='.repeat(60))

  try {
    await testBrandsAPI()
    await testProductsWithBrandAPI()
    await testSingleProduct()

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Todas las pruebas completadas')
  } catch (error) {
    console.error('\n💥 Error general en las pruebas:', error)
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ Script de pruebas finalizado')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Error ejecutando pruebas:', error)
      process.exit(1)
    })
}

module.exports = { runTests }
