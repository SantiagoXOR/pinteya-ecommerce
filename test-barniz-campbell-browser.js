/**
 * Test script para BARNIZ CAMPBELL - Ejecutar en el navegador
 * 
 * Instrucciones:
 * 1. Abrir https://pinteya.com/products/77 (BARNIZ CAMPBELL 1L)
 * 2. Abrir la consola del navegador
 * 3. Pegar y ejecutar este script
 * 4. Verificar que solo se muestre el color INCOLORO
 */

async function testBarnizCampbellFix() {
  console.log('🧪 Test BARNIZ CAMPBELL Fix - Navegador\n')

  try {
    // 1. Verificar que estamos en la página correcta
    const currentUrl = window.location.href
    const isBarnizPage = currentUrl.includes('products/77') || currentUrl.includes('products/78')
    
    if (!isBarnizPage) {
      console.log('⚠️ No estás en la página de BARNIZ CAMPBELL')
      console.log('   Navega a: https://pinteya.com/products/77')
      return
    }

    console.log('✅ Página correcta detectada:', currentUrl)

    // 2. Verificar el tipo de producto detectado
    console.log('\n🔍 Verificando tipo de producto...')
    
    // Buscar elementos que indiquen el tipo de producto
    const productTitle = document.querySelector('h1, .product-title, [data-testid="product-title"]')
    if (productTitle) {
      console.log('   - Título del producto:', productTitle.textContent?.trim())
    }

    // 3. Verificar elementos de color
    console.log('\n🎨 Verificando elementos de color...')
    
    const colorElements = document.querySelectorAll('[data-color], .color-option, .color-picker, .color-selector')
    console.log(`   - Elementos de color encontrados: ${colorElements.length}`)
    
    colorElements.forEach((el, index) => {
      const text = el.textContent?.trim()
      const className = el.className
      const dataset = el.dataset
      
      console.log(`   - Elemento ${index + 1}:`, {
        text: text || 'Sin texto',
        className: className || 'Sin clase',
        dataset: Object.keys(dataset).length > 0 ? dataset : 'Sin dataset'
      })
    })

    // 4. Verificar colores específicos
    console.log('\n🔍 Verificando colores específicos...')
    
    const incoloroElements = Array.from(colorElements).filter(el => 
      el.textContent?.toLowerCase().includes('incoloro') ||
      el.textContent?.toLowerCase().includes('transparente')
    )
    
    console.log(`   - Elementos INCOLORO encontrados: ${incoloroElements.length}`)
    
    const otherColorElements = Array.from(colorElements).filter(el => 
      !el.textContent?.toLowerCase().includes('incoloro') &&
      !el.textContent?.toLowerCase().includes('transparente') &&
      el.textContent?.trim() !== ''
    )
    
    console.log(`   - Otros colores encontrados: ${otherColorElements.length}`)
    
    if (otherColorElements.length > 0) {
      console.log('   - Colores adicionales detectados:')
      otherColorElements.forEach((el, index) => {
        console.log(`     ${index + 1}. ${el.textContent?.trim()}`)
      })
    }

    // 5. Verificar representación visual
    console.log('\n👁️ Verificando representación visual...')
    
    const colorSwatches = document.querySelectorAll('.color-swatch, .color-circle, [style*="background-color"], [style*="background"]')
    console.log(`   - Muestras de color encontradas: ${colorSwatches.length}`)
    
    colorSwatches.forEach((swatch, index) => {
      const style = swatch.style
      const backgroundColor = style.backgroundColor || style.background
      console.log(`   - Muestra ${index + 1}:`, {
        backgroundColor: backgroundColor || 'No definido',
        className: swatch.className || 'Sin clase'
      })
    })

    // 6. Verificar que solo hay un color seleccionado
    console.log('\n✅ Verificando selección única...')
    
    const selectedColors = document.querySelectorAll('.color-option.selected, .color-option.active, [data-selected="true"]')
    console.log(`   - Colores seleccionados: ${selectedColors.length}`)
    
    if (selectedColors.length === 1) {
      const selectedColor = selectedColors[0]
      console.log('   - Color seleccionado:', selectedColor.textContent?.trim())
      console.log('   - ✅ Solo un color seleccionado (correcto)')
    } else if (selectedColors.length === 0) {
      console.log('   - ⚠️ No hay colores seleccionados')
    } else {
      console.log('   - ❌ Múltiples colores seleccionados (incorrecto)')
    }

    // 7. Verificar API calls
    console.log('\n🌐 Verificando llamadas a la API...')
    
    // Interceptar llamadas a la API de productos
    const originalFetch = window.fetch
    let apiCalls = []
    
    window.fetch = function(...args) {
      const url = args[0]
      if (typeof url === 'string' && (url.includes('/api/products/') || url.includes('/api/search'))) {
        apiCalls.push(url)
      }
      return originalFetch.apply(this, args)
    }

    // Esperar un momento para capturar llamadas
    setTimeout(() => {
      console.log(`   - Llamadas a API detectadas: ${apiCalls.length}`)
      apiCalls.forEach((call, index) => {
        console.log(`     ${index + 1}. ${call}`)
      })
      
      // Restaurar fetch original
      window.fetch = originalFetch
    }, 1000)

    // 8. Resultado final
    console.log('\n📊 Resumen del test:')
    console.log(`   - Elementos de color: ${colorElements.length}`)
    console.log(`   - Elementos INCOLORO: ${incoloroElements.length}`)
    console.log(`   - Otros colores: ${otherColorElements.length}`)
    console.log(`   - Colores seleccionados: ${selectedColors.length}`)
    
    const isFixed = otherColorElements.length === 0 && selectedColors.length <= 1
    console.log(`\n✅ Fix ${isFixed ? 'FUNCIONA' : 'FALLA'}: BARNIZ CAMPBELL ${isFixed ? 'muestra solo INCOLORO' : 'aún muestra múltiples colores'}`)

  } catch (error) {
    console.error('❌ Error en el test:', error.message)
  }
}

// Ejecutar el test
testBarnizCampbellFix()
