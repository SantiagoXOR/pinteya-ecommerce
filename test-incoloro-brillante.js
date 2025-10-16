/**
 * Test script para verificar el nuevo efecto brillante del color INCOLORO
 * 
 * Instrucciones:
 * 1. Abrir https://pinteya.com/products/77 (BARNIZ CAMPBELL 1L)
 * 2. Abrir la consola del navegador
 * 3. Pegar y ejecutar este script
 * 4. Verificar que el color INCOLORO tenga efecto brillante
 */

async function testIncoloroBrillante() {
  console.log('✨ Test Color INCOLORO Brillante\n')

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

    // 2. Buscar elementos de color INCOLORO
    console.log('\n🔍 Buscando elementos de color INCOLORO...')
    
    const colorElements = document.querySelectorAll('[data-color], .color-option, .color-picker, .color-selector, button')
    const incoloroElements = Array.from(colorElements).filter(el => 
      el.textContent?.toLowerCase().includes('incoloro') ||
      el.textContent?.toLowerCase().includes('transparente')
    )
    
    console.log(`   - Elementos de color encontrados: ${colorElements.length}`)
    console.log(`   - Elementos INCOLORO encontrados: ${incoloroElements.length}`)

    // 3. Verificar estilos de los elementos INCOLORO
    console.log('\n🎨 Verificando estilos de elementos INCOLORO...')
    
    incoloroElements.forEach((el, index) => {
      const style = window.getComputedStyle(el)
      const backgroundColor = style.backgroundColor
      const backgroundImage = style.backgroundImage
      const boxShadow = style.boxShadow
      const mixBlendMode = style.mixBlendMode
      
      console.log(`   - Elemento ${index + 1}:`, {
        text: el.textContent?.trim(),
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage !== 'none' ? 'Presente' : 'Ausente',
        boxShadow: boxShadow !== 'none' ? 'Presente' : 'Ausente',
        mixBlendMode: mixBlendMode !== 'normal' ? mixBlendMode : 'Normal'
      })
    })

    // 4. Verificar elementos con efectos de brillo
    console.log('\n✨ Verificando efectos de brillo...')
    
    const elementsWithGradients = Array.from(colorElements).filter(el => {
      const style = window.getComputedStyle(el)
      return style.backgroundImage.includes('gradient')
    })
    
    console.log(`   - Elementos con gradientes: ${elementsWithGradients.length}`)
    
    const elementsWithOverlay = Array.from(colorElements).filter(el => {
      const style = window.getComputedStyle(el)
      return style.mixBlendMode === 'overlay'
    })
    
    console.log(`   - Elementos con mix-blend-mode overlay: ${elementsWithOverlay.length}`)

    // 5. Verificar pseudo-elementos de brillo
    console.log('\n🔍 Verificando pseudo-elementos de brillo...')
    
    const elementsWithPseudo = Array.from(colorElements).filter(el => {
      const before = window.getComputedStyle(el, '::before')
      const after = window.getComputedStyle(el, '::after')
      return before.content !== 'none' || after.content !== 'none'
    })
    
    console.log(`   - Elementos con pseudo-elementos: ${elementsWithPseudo.length}`)

    // 6. Verificar elementos hijos con efectos de brillo
    console.log('\n👶 Verificando elementos hijos con efectos de brillo...')
    
    const childElementsWithBrillo = Array.from(colorElements).flatMap(el => 
      Array.from(el.children).filter(child => {
        const style = window.getComputedStyle(child)
        return style.background.includes('gradient') || style.mixBlendMode === 'overlay'
      })
    )
    
    console.log(`   - Elementos hijos con efectos de brillo: ${childElementsWithBrillo.length}`)

    // 7. Verificar que no hay textura de madera
    console.log('\n🚫 Verificando ausencia de textura de madera...')
    
    const elementsWithWoodTexture = Array.from(colorElements).filter(el => {
      const style = window.getComputedStyle(el)
      return style.backgroundImage.includes('repeating-linear-gradient') || 
             style.backgroundImage.includes('radial-gradient')
    })
    
    console.log(`   - Elementos con textura de madera: ${elementsWithWoodTexture.length}`)
    
    if (elementsWithWoodTexture.length > 0) {
      console.log('   - ⚠️ Algunos elementos aún tienen textura de madera')
    } else {
      console.log('   - ✅ No se detectó textura de madera (correcto)')
    }

    // 8. Verificar transparencia
    console.log('\n🔍 Verificando transparencia...')
    
    const transparentElements = Array.from(colorElements).filter(el => {
      const style = window.getComputedStyle(el)
      return style.backgroundColor.includes('rgba') && 
             style.backgroundColor.includes('0.1')
    })
    
    console.log(`   - Elementos con transparencia rgba(255,255,255,0.1): ${transparentElements.length}`)

    // 9. Resultado final
    console.log('\n📊 Resumen del test:')
    console.log(`   - Elementos INCOLORO: ${incoloroElements.length}`)
    console.log(`   - Elementos con gradientes: ${elementsWithGradients.length}`)
    console.log(`   - Elementos con overlay: ${elementsWithOverlay.length}`)
    console.log(`   - Elementos hijos con brillo: ${childElementsWithBrillo.length}`)
    console.log(`   - Elementos con textura de madera: ${elementsWithWoodTexture.length}`)
    console.log(`   - Elementos transparentes: ${transparentElements.length}`)
    
    const hasBrillo = elementsWithGradients.length > 0 || elementsWithOverlay.length > 0 || childElementsWithBrillo.length > 0
    const noTextura = elementsWithWoodTexture.length === 0
    
    console.log(`\n✅ Test ${hasBrillo && noTextura ? 'EXITOSO' : 'FALLA'}:`)
    console.log(`   - Efecto brillante: ${hasBrillo ? '✅ Presente' : '❌ Ausente'}`)
    console.log(`   - Sin textura de madera: ${noTextura ? '✅ Correcto' : '❌ Incorrecto'}`)

  } catch (error) {
    console.error('❌ Error en el test:', error.message)
  }
}

// Ejecutar el test
testIncoloroBrillante()
