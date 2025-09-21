const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/demo/commercial-product-card');
  await page.waitForLoadState('networkidle');
  
  // Verificar si prefers-reduced-motion está activado
  const prefersReducedMotion = await page.evaluate(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  
  console.log('🎭 prefers-reduced-motion:', prefersReducedMotion);
  
  // Verificar estilos CSS computados del elemento
  const cardElement = await page.locator('[data-testid-commercial="commercial-product-card"]').first();
  
  if (await cardElement.count() > 0) {
    console.log('✅ Elemento CommercialProductCard encontrado');
    
    const styles = await cardElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        transition: computed.transition,
        transform: computed.transform,
        willChange: computed.willChange,
        animation: computed.animation,
        pointerEvents: computed.pointerEvents,
        display: computed.display,
        visibility: computed.visibility
      };
    });
    
    console.log('🎨 Estilos CSS computados:', JSON.stringify(styles, null, 2));
    
    // Verificar si el elemento responde a hover
    console.log('🖱️ Haciendo hover sobre el elemento...');
    await cardElement.hover();
    await page.waitForTimeout(1000);
    
    const stylesAfterHover = await cardElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        transform: computed.transform,
        transition: computed.transition
      };
    });
    
    console.log('🎨 Estilos después del hover:', JSON.stringify(stylesAfterHover, null, 2));
    
    // Verificar si Framer Motion está funcionando
    const framerMotionCheck = await page.evaluate(() => {
      // Buscar elementos con atributos de Framer Motion
      const motionElements = document.querySelectorAll('[style*="transform"]');
      return {
        motionElementsCount: motionElements.length,
        hasFramerMotion: typeof window.MotionGlobalConfig !== 'undefined'
      };
    });
    
    console.log('🎬 Verificación Framer Motion:', JSON.stringify(framerMotionCheck, null, 2));
    
  } else {
    console.log('❌ No se encontró el elemento CommercialProductCard');
  }
  
  await browser.close();
})();