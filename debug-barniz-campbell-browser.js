/**
 * Debug script para BARNIZ CAMPBELL - Ejecutar en el navegador
 * 
 * Instrucciones:
 * 1. Abrir la consola del navegador en https://pinteya.com
 * 2. Pegar y ejecutar este script
 * 3. Verificar los resultados
 */

async function debugBarnizCampbell() {
  console.log('🔍 Debug BARNIZ CAMPBELL - Verificando configuración de colores...\n')

  try {
    // 1. Buscar productos BARNIZ CAMPBELL usando la API interna
    console.log('📦 Buscando productos BARNIZ CAMPBELL...')
    
    const searchResponse = await fetch('/api/search?q=Barniz%20Campbell')
    if (!searchResponse.ok) {
      throw new Error(`Error en búsqueda: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    console.log('🔍 Resultados de búsqueda:', searchData)

    // 2. Buscar específicamente por ID 77 y 78
    console.log('\n📦 Verificando productos específicos...')
    
    const product77Response = await fetch('/api/products/77')
    const product78Response = await fetch('/api/products/78')
    
    if (product77Response.ok) {
      const product77 = await product77Response.json()
      console.log('🏷️  Producto 77 (1L):', product77)
    }
    
    if (product78Response.ok) {
      const product78 = await product78Response.json()
      console.log('🏷️  Producto 78 (4L):', product78)
    }

    // 3. Verificar variantes
    console.log('\n🔧 Verificando variantes...')
    
    const variants77Response = await fetch('/api/products/77/variants')
    const variants78Response = await fetch('/api/products/78/variants')
    
    if (variants77Response.ok) {
      const variants77 = await variants77Response.json()
      console.log('🎨 Variantes 77 (1L):', variants77)
    }
    
    if (variants78Response.ok) {
      const variants78 = await variants78Response.json()
      console.log('🎨 Variantes 78 (4L):', variants78)
    }

    // 4. Simular la lógica de colores del componente
    console.log('\n🔧 Simulando lógica de colores...')
    
    const mockProduct = {
      id: 77,
      name: 'Barniz Campbell',
      color: 'INCOLORO',
      measure: '1L'
    }

    // Simular la función extractColorFromName
    function extractColorFromName(name) {
      const colorKeywords = ['blanco', 'negro', 'gris', 'rojo', 'azul', 'verde', 'amarillo', 'naranja', 'rosa', 'violeta', 'marrón', 'beige', 'incoloro', 'transparente', 'natural']
      const found = colorKeywords.filter(keyword => 
        name.toLowerCase().includes(keyword)
      )
      return found.length > 0 ? found[0] : null
    }

    const extractedColor = extractColorFromName(mockProduct.name)
    console.log(`   - Color extraído del nombre: ${extractedColor}`)
    console.log(`   - Color declarado: ${mockProduct.color}`)

    // Simular mapeo de colores
    const COLOR_HEX_MAP = {
      'incoloro': 'rgba(255,255,255,0.3)',
      'transparente': 'rgba(255,255,255,0.3)',
      'natural': '#DEB887'
    }

    const colorHex = COLOR_HEX_MAP[mockProduct.color?.toLowerCase()] || '#B88A5A'
    console.log(`   - Hex mapeado: ${colorHex}`)

    // 5. Verificar cómo se renderiza en el DOM
    console.log('\n🎨 Verificando renderizado en el DOM...')
    
    // Buscar elementos de color en la página
    const colorElements = document.querySelectorAll('[data-color], .color-option, .color-picker')
    console.log(`   - Elementos de color encontrados: ${colorElements.length}`)
    
    colorElements.forEach((el, index) => {
      console.log(`   - Elemento ${index + 1}:`, {
        text: el.textContent?.trim(),
        className: el.className,
        dataset: el.dataset
      })
    })

    // 6. Recomendaciones
    console.log('\n💡 Recomendaciones:')
    console.log('   1. Verificar que las variantes en BD tengan color_name = "INCOLORO"')
    console.log('   2. Asegurar que solo se muestre un color (INCOLORO)')
    console.log('   3. Implementar representación visual correcta (círculo semi-transparente)')
    console.log('   4. Evitar que se generen colores adicionales automáticamente')

  } catch (error) {
    console.error('❌ Error en debug:', error.message)
  }
}

// Ejecutar el debug
debugBarnizCampbell()
