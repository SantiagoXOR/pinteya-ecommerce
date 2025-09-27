// Test directo de la API para verificar la respuesta
async function testAPI() {
  try {
    console.log('🔍 TEST: Iniciando test de API...')

    const response = await fetch('/api/admin/products-direct?limit=10')
    console.log('🔍 TEST: Response status:', response.status)
    console.log('🔍 TEST: Response ok:', response.ok)

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('🔍 TEST: Respuesta completa:', data)
    console.log('🔍 TEST: data.success:', data.success)
    console.log('🔍 TEST: data.data:', data.data)
    console.log('🔍 TEST: data.data.products:', data.data?.products)
    console.log('🔍 TEST: Array.isArray(data.data.products):', Array.isArray(data.data?.products))

    if (data.success && data.data && data.data.products) {
      console.log('🔍 TEST: Número de productos:', data.data.products.length)
      console.log('🔍 TEST: Primer producto:', data.data.products[0])
    }
  } catch (error) {
    console.error('🔍 TEST: Error:', error)
  }
}

// Ejecutar el test cuando se cargue la página
if (typeof window !== 'undefined') {
  window.testAPI = testAPI
  console.log('🔍 TEST: Función testAPI disponible. Ejecuta window.testAPI() en la consola.')
}
