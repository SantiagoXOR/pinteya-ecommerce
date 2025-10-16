import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Configurando entorno para tests de validación de direcciones...')
  
  // Verificar que el servidor esté funcionando
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Verificar que la página de prueba esté disponible
    await page.goto('http://localhost:3000/test-map-selector')
    await page.waitForLoadState('networkidle')
    
    console.log('✅ Servidor de desarrollo verificado')
    
    // Verificar que Google Maps esté cargado
    const mapLoaded = await page.evaluate(() => {
      return typeof window.google !== 'undefined' && 
             typeof window.google.maps !== 'undefined'
    })
    
    if (mapLoaded) {
      console.log('✅ Google Maps API cargada correctamente')
    } else {
      console.log('⚠️  Google Maps API no detectada (puede ser normal en CI)')
    }
    
  } catch (error) {
    console.error('❌ Error en setup global:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('🎯 Setup global completado')
}

export default globalSetup