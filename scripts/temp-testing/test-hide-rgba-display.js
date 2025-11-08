/**
 * Test script para verificar que el código rgba no se muestra
 * 
 * Instrucciones:
 * 1. Abrir https://pinteya.com/products/77 (BARNIZ CAMPBELL 1L)
 * 2. Abrir la consola del navegador
 * 3. Pegar y ejecutar este script
 * 4. Verificar que no se muestre "rgba(255,255,255,0.1)"
 */

async function testHideRgbaDisplay() {
  console.log('🔍 Test Ocultar Código RGBA\n')

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

    // 2. Buscar elementos que contengan código rgba
    console.log('\n🔍 Buscando elementos con código rgba...')
    
    const allElements = document.querySelectorAll('*')
    const elementsWithRgba = Array.from(allElements).filter(el => {
      const text = el.textContent || ''
      return text.includes('rgba(255,255,255,0.1)') || 
             text.includes('rgba(255,255,255,0.3)') ||
             text.includes('rgba(')
    })
    
    console.log(`   - Elementos con código rgba encontrados: ${elementsWithRgba.length}`)

    // 3. Verificar contenido específico
    if (elementsWithRgba.length > 0) {
      console.log('\n❌ Elementos que aún muestran código rgba:')
      elementsWithRgba.forEach((el, index) => {
        const text = el.textContent?.trim()
        if (text && text.includes('rgba')) {
          console.log(`   ${index + 1}. "${text}"`)
          console.log(`      - Tag: ${el.tagName}`)
          console.log(`      - Clase: ${el.className || 'Sin clase'}`)
        }
      })
    } else {
      console.log('   ✅ No se encontraron elementos con código rgba (correcto)')
    }

    // 4. Buscar específicamente en información de colores
    console.log('\n🎨 Verificando información de colores...')
    
    const colorInfoElements = document.querySelectorAll('[class*="color"], [class*="Color"], .text-gray-500, .text-gray-600')
    const colorInfoWithRgba = Array.from(colorInfoElements).filter(el => {
      const text = el.textContent || ''
      return text.includes('rgba(255,255,255,0.1)') || 
             text.includes('rgba(255,255,255,0.3)')
    })
    
    console.log(`   - Elementos de información de color con rgba: ${colorInfoWithRgba.length}`)

    // 5. Verificar que se muestre solo información amigable
    console.log('\n✅ Verificando información amigable...')
    
    const incoloroElements = Array.from(allElements).filter(el => {
      const text = el.textContent || ''
      return text.toLowerCase().includes('incoloro') && 
             !text.includes('rgba')
    })
    
    console.log(`   - Elementos INCOLORO sin código técnico: ${incoloroElements.length}`)
    
    if (incoloroElements.length > 0) {
      console.log('   - Información amigable encontrada:')
      incoloroElements.forEach((el, index) => {
        const text = el.textContent?.trim()
        if (text && text.toLowerCase().includes('incoloro')) {
          console.log(`     ${index + 1}. "${text}"`)
        }
      })
    }

    // 6. Verificar descripción del color
    console.log('\n📝 Verificando descripción del color...')
    
    const descriptionElements = Array.from(allElements).filter(el => {
      const text = el.textContent || ''
      return text.includes('Transparente completamente incoloro con brillo') ||
             text.includes('Transparentes • Madera')
    })
    
    console.log(`   - Elementos con descripción amigable: ${descriptionElements.length}`)

    // 7. Resultado final
    console.log('\n📊 Resumen del test:')
    console.log(`   - Elementos con código rgba: ${elementsWithRgba.length}`)
    console.log(`   - Elementos de color con rgba: ${colorInfoWithRgba.length}`)
    console.log(`   - Elementos INCOLORO sin código técnico: ${incoloroElements.length}`)
    console.log(`   - Elementos con descripción amigable: ${descriptionElements.length}`)
    
    const isFixed = elementsWithRgba.length === 0 && colorInfoWithRgba.length === 0
    console.log(`\n✅ Test ${isFixed ? 'EXITOSO' : 'FALLA'}:`)
    console.log(`   - Código rgba oculto: ${isFixed ? '✅ Correcto' : '❌ Aún visible'}`)
    console.log(`   - Información amigable: ${incoloroElements.length > 0 ? '✅ Presente' : '❌ Ausente'}`)

  } catch (error) {
    console.error('❌ Error en el test:', error.message)
  }
}

// Ejecutar el test
testHideRgbaDisplay()
